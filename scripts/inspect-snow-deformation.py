import bpy,json
from pathlib import Path
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.startswith('RIG-'))
report={'meshes':[{'name':o.name,'modifiers':[{'name':m.name,'type':m.type,'show':m.show_viewport} for m in o.modifiers],'vertices':len(o.data.vertices)} for o in bpy.data.objects if o.type=='MESH' and o.name.lower().startswith('geo-') and not o.hide_render], 'bones':[{'name':b.name,'segments':b.bbone_segments,'inheritScale':b.inherit_scale,'rotation':b.use_inherit_rotation} for b in rig.data.bones if b.name.startswith('DEF-') and any(x in b.name.lower() for x in ['arm','spine','hip','thigh'])]}
Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/snow-deformation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
