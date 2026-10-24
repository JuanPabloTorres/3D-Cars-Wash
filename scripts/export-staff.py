"""Convert official Blender Studio character to portable, deform-only glTF.
Source rigs remain external and untouched. PBR textures are explicitly mapped.
Animation clips are newly authored on a simplified copy of the licensed rig.
"""
import bpy, math, json, sys
from pathlib import Path
from mathutils import Vector, Matrix
root=Path(__file__).resolve().parents[1]
role=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'receptionist'
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.startswith('RIG-'))
if bpy.context.object and bpy.context.object.mode!='OBJECT':bpy.ops.object.mode_set(mode='OBJECT')
prefix='rain' if role=='receptionist' else 'snow'
sources=[o for o in bpy.data.objects if o.type=='MESH' and o.name.lower().startswith('geo-') and not o.hide_render and 'helper' not in o.name.lower()]
if role=='worker':
    # Snow's render eye depends on a complex shader. The artist also supplies
    # a native animation eye with explicit sclera/iris/pupil material regions.
    sources=[o for o in sources if o.name!='GEO-snow-eyes' and 'deformer' not in o.name.lower()]
    proxy=bpy.data.objects.get('GEO-snow-eye_anim')
    assert proxy is not None,'Professional portable eye mesh is required'
    sources.append(proxy)
# The exported skeleton includes original bone ancestors, preserving skin transforms.
used=set();weighted=set()
for o in sources:
    for g in o.vertex_groups:
        b=rig.data.bones.get(g.name)
        if b:weighted.add(b.name)
        while b:
            used.add(b.name);b=b.parent
arm=bpy.data.armatures.new('Febles-'+role)
outRig=bpy.data.objects.new('StaffRig',arm);bpy.context.collection.objects.link(outRig)
outRig.matrix_world=rig.matrix_world.copy()
bpy.ops.object.select_all(action='DESELECT');outRig.select_set(True);bpy.context.view_layer.objects.active=outRig
bpy.ops.object.mode_set(mode='EDIT')
for b in rig.data.bones:
    if b.name not in used:continue
    e=arm.edit_bones.new(b.name);e.head=b.head_local;e.tail=b.tail_local;e.matrix=b.matrix_local
for b in rig.data.bones:
    if b.name in used and b.parent and b.parent.name in used:arm.edit_bones[b.name].parent=arm.edit_bones[b.parent.name]
bpy.ops.object.mode_set(mode='OBJECT')
segments={}
if role=='worker':
    bpy.context.view_layer.update()
    restRig=rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
    segment_rest={name:[restRig.pose.bones[name].bbone_segment_matrix(i,rest=True).copy() for i in range(rig.data.bones[name].bbone_segments+1)] for name in weighted if rig.data.bones[name].bbone_segments>1}
    bpy.ops.object.mode_set(mode='EDIT')
    for name,matrices in segment_rest.items():
        segments[name]=[]
        for i,matrix in enumerate(matrices):
            key='SEG-'+name+'-'+str(i);segments[name].append(key)
            e=arm.edit_bones.new(key);e.head=(rig.data.bones[name].matrix_local@matrix).translation;e.tail=e.head+Vector((0,.03,0));e.matrix=rig.data.bones[name].matrix_local@matrix;e.parent=arm.edit_bones[name]
    bpy.ops.object.mode_set(mode='OBJECT')
for b in outRig.data.bones:
    original=rig.data.bones.get(b.name)
    b.inherit_scale='FULL' if role=='worker' else original.inherit_scale
    b.use_inherit_rotation=True if role=='worker' else original.use_inherit_rotation
    b.use_local_location=True if role=='worker' else original.use_local_location
exportObjects=[outRig]
sys.path.insert(0,str(Path(__file__).parent))
from staff_materials import StaffMaterials
portable=StaffMaterials(role)
for original in sources:
    if any(s in original.name.lower() for s in ['eye_dot','cornea']):continue
    obj=original.copy();obj.data=original.data.copy();obj.name=original.name.replace('GEO-','Staff-')
    bpy.context.collection.objects.link(obj);obj.hide_set(False);obj.hide_render=False
    if role=='worker':
        # Preserve the artist's body masks and mirrored shoes before skinning.
        if obj.data.shape_keys:obj.shape_key_clear()
        for modifier in list(obj.modifiers):
            if modifier.type not in ['MASK','MIRROR'] or not modifier.show_viewport:obj.modifiers.remove(modifier)
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        for modifier in list(obj.modifiers):
            if modifier.type in ['MASK','MIRROR'] and modifier.show_viewport:bpy.ops.object.modifier_apply(modifier=modifier.name)
    if role=='worker' and segments:
        toRig=rig.matrix_world.inverted()@original.matrix_world
        restRig=rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
        assignments=[]
        for vertex in obj.data.vertices:
            weights={}
            for group in vertex.groups:
                name=obj.vertex_groups[group.group].name
                if name not in weighted:continue
                if name in segments:
                    index,blend=restRig.pose.bones[name].bbone_segment_index(toRig@vertex.co)
                    for key,factor in [(segments[name][index],1-blend),(segments[name][index+1],blend)]:weights[key]=weights.get(key,0)+group.weight*factor
                else:weights[name]=weights.get(name,0)+group.weight
            assignments.append(sorted(weights.items(),key=lambda p:-p[1])[:4])
        for group in list(obj.vertex_groups):
            if group.name in weighted:obj.vertex_groups.remove(group)
        for index,weights in enumerate(assignments):
            total=sum(w for _,w in weights)
            for name,weight in weights:
                group=obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
                if total>0:group.add([index],weight/total,'REPLACE')
    obj.parent=outRig;obj.matrix_world=original.matrix_world.copy()
    for modifier in list(obj.modifiers):obj.modifiers.remove(modifier)
    mod=obj.modifiers.new('Skin','ARMATURE');mod.object=outRig
    if obj.data.shape_keys:obj.shape_key_clear()
    portable.assign(obj.data,original)
    for poly in obj.data.polygons:poly.use_smooth=True
    exportObjects.append(obj)
# Author animation on original hierarchy copies; all constraints are absent.
upper=[b for b in rig.pose.bones if b.name.startswith('FK-Upperarm') and 'Parent' not in b.name]
if not upper:upper=[b for b in rig.pose.bones if b.name.startswith('FK-UpperArm')]
for b in rig.pose.bones:
    if b.name.startswith('Properties'):
        for prop in list(b.keys()):
            if prop in ['ik_arm_left','ik_arm_right','ik_left_upperarm','ik_right_upperarm']:b[prop]=0.0
print('UPPER_CONTROLS', [b.name for b in upper])
def smooth(x):
    x=max(0,min(1,x));return x*x*(3-2*x)

def aim_control(name, direction, palm_normal=None):
    if role=='worker':name=name.replace('Upperarm','UpperArm').replace('FK-Hand','FK-Wrist')
    b=rig.pose.bones.get(name)
    if not b:
        raise RuntimeError('Required animation control missing: '+name)
    # Blender bones extend along local Y. Build an anatomical frame in rig space,
    # then derive its LOCAL basis from the evaluated parent (no global-axis offsets).
    y=Vector(direction).normalized()
    if palm_normal is not None:
        # Rain's palm faces -local X, measured from its rest metacarpal plane.
        x=-Vector(palm_normal);x=(x-y*x.dot(y)).normalized();z=x.cross(y).normalized()
    else:
        z=Vector((0,-1,0));z=(z-y*z.dot(y)).normalized();x=y.cross(z).normalized()
    orientation=Matrix((x,y,z)).transposed().to_4x4();orientation.translation=b.head.copy()
    kwargs={}
    if b.parent:kwargs={'parent_matrix':b.parent.matrix.copy(),'parent_matrix_local':b.parent.bone.matrix_local}
    basis=b.bone.convert_local_to_pose(orientation,b.bone.matrix_local,invert=True,**kwargs)
    b.rotation_mode='QUATERNION';b.rotation_quaternion=basis.to_quaternion()
    bpy.context.view_layer.update()

def pose(kind,t):
    # One staged 3.2s greeting: acknowledge, raise, two gentle waves, settle.
    env=smooth((t-.12)/.2)*(1-smooth((t-.73)/.25)) if kind=='Greet' else 0
    for side,sign in [('L',1),('R',-1)]:
        upper_rest=Vector((sign*.19,-.06,-.98))
        fore_rest=Vector((sign*.08,-.19,-.98))
        hand_rest=Vector((sign*.04,-.1,-.99))
        if kind=='Greet' and side=='R':
            u=upper_rest.lerp(Vector((-.78,-.18,-.60)),env)
            f=fore_rest.lerp(Vector((-.12,-.1,.988)),env)
            wave=math.sin(max(0,t-.34)*math.pi*8)*.105 if .34<t<.73 else 0
            h=hand_rest.lerp(Vector((wave,-.03,1)),env)
            aim_control('FK-Upperarm.'+side,u)
            aim_control('FK-Forearm.'+side,f)
            # Rest palm inward; greeting palm toward the visitor, fingers upward.
            palm=Vector((-1,0,0)).lerp(Vector((0,-1,0)),env)
            aim_control('FK-Hand.'+side,h,palm)
        elif kind in ('PointServices','PointOrder') and side==('R' if kind=='PointServices' else 'L'):
            # Point down toward the actual catalogue / order terminal, with a
            # complete shoulder-elbow-hand motion that returns to rest.
            point=smooth((t-.12)/.24)*(1-smooth((t-.64)/.34))
            u=upper_rest.lerp(Vector((sign*.44,-.5,-.74)),point)
            f=fore_rest.lerp(Vector((sign*.55,-.78,-.30)),point)
            h=hand_rest.lerp(Vector((sign*.40,-.88,-.25)),point)
            aim_control('FK-Upperarm.'+side,u)
            aim_control('FK-Forearm.'+side,f)
            aim_control('FK-Hand.'+side,h,(-sign,0,0))
        else:
            breath=math.sin(t*math.pi*2)
            if kind=='Service':
                u=Vector((sign*.26,-.80,-.55));f=Vector((sign*.15,-.90,.3+breath*.08));h=f
            elif kind=='ServiceInterior':
                u=Vector((sign*.22,-.62,-.75));f=Vector((sign*.08,-.98,-.14+breath*.025));h=f
            elif kind=='ServiceLights':
                u=Vector((sign*.18,-.42,-.89));f=Vector((sign*.08,-.78,-.62+breath*.02));h=f
            elif kind=='ServiceInspect':
                u=Vector((sign*.18,-.12,-.98));f=Vector((sign*.05,-.45,-.9));h=f
            elif kind=='Talk':
                u=Vector((sign*.22,-.14,-.96));f=Vector((sign*.08,-.52,-.83+breath*.025));h=f
            else:u=upper_rest;f=fore_rest;h=hand_rest
            aim_control('FK-Upperarm.'+side,u)
            aim_control('FK-Forearm.'+side,f)
            aim_control('FK-Hand.'+side,h,(-sign,0,0))
    head=rig.pose.bones.get('FK-Head')
    if role=='worker':
        spine=rig.pose.bones['FK-Spine'];spine.rotation_mode='XYZ'
        spine.rotation_euler.x={'Service':.10,'ServiceInterior':.22,'ServiceLights':.24,'ServiceInspect':.08}.get(kind,0)
    if head:
        head.rotation_mode='XYZ';head.rotation_euler.x=math.sin(t*math.pi*2)*(.018 if kind!='Idle' else .009)
        head.rotation_euler.y=env*.035
bpy.context.scene.render.fps=24
ordered=sorted(list(outRig.pose.bones),key=lambda b:len(b.parent_recursive))
outRig.animation_data_clear();outRig.animation_data_create()
for kind in ['Idle','Greet','Talk','Service']+(['ServiceInterior','ServiceLights','ServiceInspect'] if role=='worker' else ['PointServices','PointOrder']):
    action=bpy.data.actions.new(kind);outRig.animation_data.action=action
    for frame in range(1,81,4 if role=='worker' else 2):
        bpy.context.scene.frame_set(frame);pose(kind,(frame-1)/79)
        bpy.context.view_layer.update()
        evaluated=rig.evaluated_get(bpy.context.evaluated_depsgraph_get())
        for b in ordered:
            b.rotation_mode='QUATERNION'
            if b.name.startswith('SEG-'):
                name,index=b.name[4:].rsplit('-',1)
                matrix=evaluated.pose.bones[name].matrix@evaluated.pose.bones[name].bbone_segment_matrix(int(index),rest=False)
            else:matrix=evaluated.pose.bones[b.name].matrix
            options={}
            if b.parent:
                options={'parent_matrix':evaluated.pose.bones[b.parent.name].matrix,'parent_matrix_local':b.parent.bone.matrix_local}
            b.matrix_basis=b.bone.convert_local_to_pose(matrix,b.bone.matrix_local,invert=True,**options)
            b.keyframe_insert(data_path='rotation_quaternion',frame=frame,group=b.name)
            b.keyframe_insert(data_path='location',frame=frame,group=b.name)
            b.keyframe_insert(data_path='scale',frame=frame,group=b.name)
    track=outRig.animation_data.nla_tracks.new();track.name=kind
    track.strips.new(kind,1,action);track.mute=True
outRig.animation_data.action=None
bpy.ops.object.select_all(action='DESELECT')
for obj in exportObjects:obj.select_set(True)
bpy.context.view_layer.objects.active=outRig
dest=Path(sys.argv[sys.argv.index('--output')+1]).resolve() if '--output' in sys.argv else root/'public/models'/(role+'.glb');dest.parent.mkdir(parents=True,exist_ok=True)
preflight=[]
for obj in exportObjects:
    if obj.type!='MESH':continue
    for slot in obj.material_slots:
        if not slot.material:continue
        for node in slot.material.node_tree.nodes:
            if node.type=='TEX_IMAGE' and node.image:
                preflight.append({'object':obj.name,'material':slot.material.name,'image':node.image.name,'source':node.image.source,'size':list(node.image.size)})
Path('C:/Projects/Assets/Febles-G1-20261023/'+role+'-texture-preflight.json').write_text(json.dumps(preflight,indent=2))
assert all(i['source']!='TILED' and min(i['size'])>0 for i in preflight),'Nonportable texture remains; export stopped'
bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_animations=True,
    export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,
    export_apply=False,export_skins=True,export_morph=False,export_def_bones=False,
    export_image_format='JPEG',export_image_quality=88,export_extras=False)
print('EXPORTED',dest,dest.stat().st_size)

