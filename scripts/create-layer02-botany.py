"""New botanical geometry built in an isolated Blender process, in metres.
No prior .blend, GLB, foliage geometry or material is imported.
Run: blender --background --factory-startup --disable-autoexec --python FILE.
Outputs are confined to the dedicated candidate directory, never live assets.
"""
import bpy
import math
import random
import json
import os
from pathlib import Path
from mathutils import Vector, noise

OUT = Path(os.environ.get('BOTANY_OUTPUT', 'C:/Projects/Assets/CarWash-Layer02-NewBotany-20261024'))
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
rng = random.Random(241024)


def srgb(hex_color):
    values = [int(hex_color[i:i+2], 16) / 255 for i in (1, 3, 5)]
    return [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values]


def material(name, color, roughness=.74):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*srgb(color), 1)
    p.inputs['Roughness'].default_value = roughness
    p.inputs['Specular IOR Level'].default_value = .22
    return m


foliage = [material('leaf-medium', '#466326'), material('leaf-depth', '#263f20'),
           material('leaf-sunlit', '#718d35'), material('leaf-new-growth', '#99af4b')]
bark = material('warm-grey-fissured-bark', '#b7ac91', .98)
stem = material('green-stems', '#64743f', .94)


def normal_texture(name, heights, size, strength):
    """Export an explicit tangent-space normal image supported by glTF."""
    rgba = []
    for y in range(size):
        for x in range(size):
            dx = heights[y*size+min(size-1,x+1)]-heights[y*size+max(0,x-1)]
            dy = heights[min(size-1,y+1)*size+x]-heights[max(0,y-1)*size+x]
            n = Vector((-dx*strength,dy*strength,1)).normalized()
            rgba.extend((n.x*.5+.5,n.y*.5+.5,n.z*.5+.5,1))
    image = bpy.data.images.new(name,width=size,height=size)
    image.colorspace_settings.name='Non-Color'
    image.pixels.foreach_set(rgba); image.filepath_raw=str(OUT/(name+'.png'))
    image.file_format='PNG'; image.save(); image.pack()
    return image


def attach_normal(mat, image, strength):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    texture=nodes.new('ShaderNodeTexImage'); texture.image=image
    normal=nodes.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value=strength
    links.new(texture.outputs['Color'],normal.inputs['Color'])
    links.new(normal.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])

# A new procedural bark image, with narrow irregular fissures rather than a
# flat brown shader. Cylindrical UVs vary the sampled region on each branch.
size = 512
pixels = []
for y in range(size):
    for x in range(size):
        u, v = x / size, y / size
        fine = noise.noise_vector(Vector((u * 90, v * 7, 4))).x
        coarse = noise.noise_vector(Vector((u * 13, v * 3, 9))).y
        fissure = max(0, math.sin(u * 185 + coarse * 4)) ** 12
        value = .34 + .07 * fine + .05 * coarse - .1 * fissure
        pixels.extend((value * 1.02, value * .97, value * .85, 1))
image = bpy.data.images.new('new-botany-bark-512', width=size, height=size)
image.pixels.foreach_set(pixels)
image.filepath_raw = str(OUT / 'new-bark.png')
image.file_format = 'PNG'
image.save()
image.pack()
node = bark.node_tree.nodes.new('ShaderNodeTexImage')
node.image = image
bark.node_tree.links.new(node.outputs['Color'], bark.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
attach_normal(bark,normal_texture('new-bark-normal',[pixels[i] for i in range(0,len(pixels),4)],size,15),.8)

# Shared new leaf detail: subtle midrib, diagonal veins and mottling. The
# geometry supplies the silhouette, so no alpha cutout or black fringe exists.
pixels = []
for y in range(size):
    for x in range(size):
        u, v = x / (size-1), y / (size-1)
        midrib = math.exp(-((u-.5)/.012)**2)
        veins = max(0, math.cos((v-abs(u-.5)*.75)*math.tau*13))**24
        grain = noise.noise_vector(Vector((u*55,v*75,2))).x
        value = .65 + .06*grain + .12*midrib + .035*veins - .12*abs(u-.5)
        pixels.extend((value,value,value,1))
leaf_image = bpy.data.images.new('new-leaf-veins-512',width=size,height=size)
leaf_image.pixels.foreach_set(pixels)
leaf_image.filepath_raw = str(OUT/'new-leaf-veins.png')
leaf_image.file_format = 'PNG'
leaf_image.save(); leaf_image.pack()
leaf_normal=normal_texture('new-leaf-normal',[pixels[i] for i in range(0,len(pixels),4)],size,5)
for mat in foliage:
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    p = nodes.get('Principled BSDF')
    linear = tuple(p.inputs['Base Color'].default_value)
    color = [12.92*v if v <= .0031308 else 1.055*v**(1/2.4)-.055 for v in linear[:3]]
    # Bake the colour into pixels explicitly: generic Blender mix nodes are
    # not a glTF material contract and can export a white texture silently.
    coloured = bpy.data.images.new('new-'+mat.name,width=size,height=size)
    rgba = []
    for i in range(0,len(pixels),4):
        detail = pixels[i] / .65
        rgba.extend((detail*color[0],detail*color[1],detail*color[2],1))
    coloured.pixels.foreach_set(rgba)
    coloured.filepath_raw=str(OUT/('new-'+mat.name+'.png'))
    coloured.file_format='PNG'; coloured.save(); coloured.pack()
    texture = nodes.new('ShaderNodeTexImage'); texture.image = coloured
    links.new(texture.outputs['Color'],p.inputs['Base Color'])
    attach_normal(mat,leaf_normal,.35)


class MeshBuilder:
    def __init__(self):
        self.vertices, self.faces, self.materials, self.uv = [], [], [], []

    def leaf(self, base, direction, length, width, roll=0, tone=0, droop=.15):
        axis = Vector(direction).normalized()
        side = axis.cross(Vector((0, 0, 1)))
        if side.length < .1:
            side = axis.cross(Vector((0, 1, 0)))
        side.normalize()
        normal = side.cross(axis).normalized()
        side = side * math.cos(roll) + normal * math.sin(roll)
        normal = side.cross(axis).normalized()
        start = len(self.vertices)
        stations = 9 if length > .3 else 5
        for j in range(stations):
            t = j / (stations-1)
            half = width * .5 * math.sin(math.pi * t) ** .75
            center = Vector(base) + axis * length * t + Vector((0, 0, -droop * length * t * t))
            for across in (-1, 0, 1):
                p = center + side * half * across + normal * width * .13 * abs(across) * math.sin(math.pi * t)
                self.vertices.append(tuple(p)); self.uv.append(((across + 1) / 2, t))
        for j in range(stations-1):
            for k in range(2):
                a = start + j * 3 + k
                self.faces.append((a, a+1, a+4, a+3)); self.materials.append(tone)

    def branch(self, points, radii, sides=9, tone=0):
        start = len(self.vertices)
        for j, point in enumerate(points):
            tangent = Vector(points[min(j+1, len(points)-1)]) - Vector(points[max(j-1, 0)])
            tangent.normalize()
            side = tangent.cross(Vector((0, 1, 0))).normalized()
            normal = tangent.cross(side).normalized()
            for k in range(sides):
                angle = k / sides * math.tau
                radius = radii[j] * (1 + .055 * math.sin(k * 2.3 + j * .8))
                p = Vector(point) + (side * math.cos(angle) + normal * math.sin(angle)) * radius
                self.vertices.append(tuple(p)); self.uv.append((k / sides * 2, j * .22))
        for j in range(len(points)-1):
            for k in range(sides):
                a = start + j*sides+k; b = start + j*sides+(k+1)%sides
                self.faces.append((a,b,b+sides,a+sides)); self.materials.append(tone)

    def object(self, name, mats):
        mesh = bpy.data.meshes.new(name)
        mesh.from_pydata(self.vertices, [], self.faces)
        mesh.update()
        for m in mats: mesh.materials.append(m)
        uv = mesh.uv_layers.new(name='UVMap')
        for poly, mat_index in zip(mesh.polygons, self.materials):
            poly.material_index = mat_index
            poly.use_smooth = True
            for index in poly.loop_indices:
                uv.data[index].uv = self.uv[mesh.loops[index].vertex_index]
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        return obj


def tone():
    return rng.choices([0,1,2,3], [.6,.26,.12,.02])[0]


def leafy_cluster(leaves, wood, center, radius, count):
    # Ellipsoidal cloud with jittered, individually curved broad leaves.
    for _ in range(count):
        direction = Vector((rng.gauss(0,1), rng.gauss(0,1), rng.gauss(0,.65))).normalized()
        distance = rng.random() ** .38
        p = Vector(center) + Vector((direction.x*radius, direction.y*radius, direction.z*radius*.72)) * distance
        orientation = direction + Vector((rng.uniform(-.5,.5), rng.uniform(-.5,.5), .15))
        # Every blade has a physical twig to its parent branch. Keep the existing
        # random leaf positions/palette; do not hide disconnected leaves with density.
        wood.branch([Vector(center), p], [.004, .0012], 3)
        leaves.leaf(p, orientation, rng.uniform(.15,.25), rng.uniform(.065,.105), rng.uniform(-.8,.8), tone(), .22)


def shade_tree():
    wood, leaves = MeshBuilder(), MeshBuilder()
    trunk = [(math.sin(t*.7)*.09, math.sin(t*.43)*.06, t*.22) for t in range(22)]
    wood.branch(trunk, [.22*(1-t/26)**.8+.015 for t in range(22)], 12)
    for i in range(11):
        angle = i*2.39996 + rng.uniform(-.28,.28)
        z = 2.25 + (i%4)*.53
        span = rng.uniform(1.65,2.5)
        start = Vector((0,0,z))
        end = Vector((math.cos(angle)*span, math.sin(angle)*span, z+rng.uniform(1,1.7)))
        points = [start.lerp(end,t/7)+Vector((0,0,.3*math.sin(t/7*math.pi))) for t in range(8)]
        wood.branch(points, [.095*(1-t/8)**1.3+.007 for t in range(8)])
        for j in range(5):
            a = angle + (j-2)*.48
            root = points[3+j//2]
            tip = end + Vector((math.cos(a)*rng.uniform(.25,.8),math.sin(a)*rng.uniform(.25,.8),rng.uniform(-.2,.65)))
            wood.branch([root,root.lerp(tip,.5)+Vector((0,0,.12)),tip], [.026,.014,.003],6)
            leafy_cluster(leaves, wood, tip, rng.uniform(.53,.82), 115)
    wood.branch([Vector(trunk[-1]),Vector((.05,0,5.45))],[.035,.012],6)
    leafy_cluster(leaves, wood, (.05,0,5.45), .95, 450)
    return [wood.object('shade-branches', [bark]),leaves.object('shade-foliage',foliage)]


def shrub():
    wood, leaves = MeshBuilder(), MeshBuilder()
    for i in range(18):
        a=i*2.39996; r=.36*math.sqrt((i+.5)/18)
        end=Vector((math.cos(a)*r,math.sin(a)*r,.32+rng.random()*.2))
        wood.branch([(0,0,0),end*.55,end],[.012,.007,.0025],5)
        for j in range(32):
            angle=j*2.39996
            p=end+Vector((math.cos(angle)*rng.uniform(.03,.18),math.sin(angle)*rng.uniform(.03,.18),rng.uniform(-.12,.16)))
            wood.branch([end,p],[.0035,.001],3)
            leaves.leaf(p,(math.cos(angle),math.sin(angle),rng.uniform(-.3,.8)),rng.uniform(.09,.17),rng.uniform(.035,.065),rng.uniform(-.5,.5),tone(),.12)
    return [wood.object('shrub-stems',[stem]),leaves.object('shrub-foliage',foliage)]


def broadleaf():
    stems, leaves = MeshBuilder(), MeshBuilder()
    for i in range(13):
        angle=i*2.39996
        end=Vector((math.cos(angle)*.12,math.sin(angle)*.12,rng.uniform(.25,.48)))
        stems.branch([(0,0,0),end*.55,end],[.012,.009,.004],6)
        leaves.leaf(end,(math.cos(angle),math.sin(angle),.3+(i%3)*.22),rng.uniform(.32,.43),rng.uniform(.16,.23),rng.uniform(-.25,.25),0 if i%3 else 2,.65)
    return [stems.object('broadleaf-stems',[stem]),leaves.object('broadleaf-foliage',foliage)]


def palm():
    wood, leaves = MeshBuilder(), MeshBuilder()
    points=[(.24*math.sin(i/35*1.8),.04*math.sin(i*.4),i*7.5/35) for i in range(36)]
    wood.branch(points,[.17-.07*i/35+.008*math.sin(i*3) for i in range(36)],12)
    crown=Vector(points[-1])
    for f in range(18):
        a=f*2.39996; extent=2.6+rng.random()*.65
        pts=[]
        for j in range(19):
            t=j/18
            pts.append(crown+Vector((math.cos(a)*extent*t,math.sin(a)*extent*t,.8*math.sin(t*math.pi)-.85*t*t+(f%3)*.18)))
        wood.branch(pts,[.028*(1-j/19)+.002 for j in range(19)],5)
        for j in range(1,18):
            t=j/18
            for sign in (-1,1):
                direction=Vector((math.cos(a)*.5-sign*math.sin(a),math.sin(a)*.5+sign*math.cos(a),-.22))
                leaves.leaf(pts[j],direction,.82*math.sin(math.pi*t)**.65+.1,.055,rng.uniform(-.3,.3),tone(),.45)
    return [wood.object('palm-trunk-and-rachis',[bark]),leaves.object('palm-fronds',foliage)]


def ground_cover():
    leaves=MeshBuilder()
    for i in range(70):
        a=i*2.39996; r=.26*math.sqrt(i/70)
        leaves.leaf((math.cos(a)*r,math.sin(a)*r,.02),(math.cos(a),math.sin(a),1.4),rng.uniform(.14,.24),.035,rng.uniform(-.4,.4),tone(),.25)
    return [leaves.object('groundcover-foliage',foliage)]


manifest=[]
for name, factory in [('warmShadeTree',shade_tree),('warmPalm',palm),('warmShrub',shrub),('warmBroadleaf',broadleaf),('warmGroundcover',ground_cover)]:
    bpy.ops.object.select_all(action='DESELECT')
    objects=factory()
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    path=OUT/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_materials='EXPORT',export_yup=True,export_tangents=True)
    manifest.append({'asset':name,'source':'new procedural Blender geometry; no imported assets','vertices':sum(len(o.data.vertices) for o in objects),'polygons':sum(len(o.data.polygons) for o in objects),'bytes':path.stat().st_size})
    for obj in objects: obj.hide_set(True); obj.hide_render=True
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'new-tropical-botany.blend'))
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps(manifest))
