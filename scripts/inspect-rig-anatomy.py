import bpy,json
from pathlib import Path
r=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.startswith('RIG-'))
a={'world':[list(x) for x in r.matrix_world],'bones':{}}
for b in r.pose.bones:
 if b.name.startswith(('FK-Upperarm','FK-Forearm','FK-Hand','FK-Head','FK-Chest','FK-Index','FK-Middle','FK-Thumb')):
  a['bones'][b.name]={'head':list(b.head),'tail':list(b.tail),'rest':[list(x) for x in b.bone.matrix_local],'parent':b.parent.name if b.parent else '', 'constraints':[(c.name,c.type) for c in b.constraints]}
Path('C:/Projects/Assets/Febles-G1-20261023/rig-anatomy.json').write_text(json.dumps(a,indent=2))
