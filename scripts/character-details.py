import bpy,json
from pathlib import Path
rig = next(o for o in bpy.data.objects if o.type=='ARMATURE' and o.name.startswith('RIG-'))
data = {'rig':rig.name, 'controls':{},'images':[], 'materials':{}}
for b in rig.pose.bones:
    if any(s in b.name for s in ['Upperarm','Forearm','Hand','Head','Jaw','Properties','Properties','PROP']):
        if not b.name.startswith(('DEF','ORG','MCH')):
            data['controls'][b.name] = {'props':{k:str(v) for k,v in b.items()}, 'rotation':list(b.rotation_euler), 'mode':b.rotation_mode}
for i in bpy.data.images:
    if i.source=='FILE':data['images'].append({'name':i.name,'path':i.filepath,'size':list(i.size)})
for mat in bpy.data.materials:
    if not mat.node_tree: continue
    data['materials'][mat.name] = [{'node':n.name,'type':n.type,'image': n.image.name if n.type=='TEX_IMAGE' and n.image else None, 'attribute':getattr(n,'layer_name',None)} for n in mat.node_tree.nodes if n.type in {'TEX_IMAGE','VERTEX_COLOR'}]
Path('C:/Projects/Assets/Febles-G1-20261023/'+rig.name+'-details.json').write_text(json.dumps(data,indent=2))
print('DETAILS_SAVED',rig.name)
