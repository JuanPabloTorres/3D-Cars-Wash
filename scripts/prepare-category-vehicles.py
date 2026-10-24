"""Rejected Rgsdev candidate review. Writes outside the active asset directory."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
source=Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/rgsdev/unpacked/Free Low Poly Vehicles Pack by Rgsdev')
report=[]
for category,name,length in [('car','Sedan',4.5),('pickup','Pickup',5.2),('suv','SUV',4.7),('truck','Truck',5.8)]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.fbx(filepath=str(source/name/(name+'.fbx')))
 objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
 info=[{'name':o.name,'size':list(o.dimensions),'location':list(o.location),'materials':[m.name for m in o.data.materials if m]} for o in objects]
 report.append({'category':category,'objects':info})
 # Original pack is intentionally broad. Adapt each actual body to a documented
 # road footprint, bake transforms, retain separate authored wheel assemblies.
 points=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box]
 lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
 center=(lo+hi)/2;factor=length/(hi.y-lo.y);width=min(2.3 if category!='truck' else 2.4,(hi.x-lo.x)*factor)
 sx=width/(hi.x-lo.x)
 for o in objects:
  original=o.name.lower()
  if 'wheel' in original:
   o.name='Wheel'+('Front' if 'front' in original else 'Rear')+('L' if 'left' in original else 'R')+('2' if original.endswith('2') else '')
  for v in o.data.vertices:
   p=o.matrix_world@v.co;v.co=Vector(((p.x-center.x)*sx,(p.y-center.y)*factor,(p.z-lo.z)*factor))
  o.matrix_world.identity()
 for m in bpy.data.materials:
  if not m.use_nodes:continue
  shader=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
  if shader:
   shader.inputs['Roughness'].default_value=.32 if 'body' in m.name else .5
   shader.inputs['Metallic'].default_value=.4 if 'body' in m.name else 0
 candidate=source.parent/'candidates';candidate.mkdir(exist_ok=True)
 bpy.ops.export_scene.gltf(filepath=str(candidate/('vehicle-'+category+'.glb')),export_format='GLB',export_animations=False,export_extras=True)
Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/category-source-inspection.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
