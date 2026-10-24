import bpy,json
from pathlib import Path
report=[]
for o in bpy.data.objects:
 if o.type=='MESH' and o.name.startswith('GEO-') and ('eye' in o.name.lower() or 'cornea' in o.name.lower()):
  report.append({'name':o.name,'materials':[s.material.name for s in o.material_slots if s.material],'bounds':[list(v) for v in o.bound_box],'groups':[g.name for g in o.vertex_groups][:6]})
Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/snow-eyes.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print([(r['name'],r['materials']) for r in report])
