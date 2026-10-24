import bpy,json
from pathlib import Path
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.startswith('RIG-'))
result={'name':rig.name,'bones':[b.name for b in rig.pose.bones if any(x in b.name.lower() for x in ['wrist','spine'])],'properties':{b.name:{k:str(b[k]) for k in b.keys()} for b in rig.pose.bones if 'propert' in b.name.lower()}}
Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/snow-rig.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2))

