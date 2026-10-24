import bpy, json
from pathlib import Path
out = Path('C:/Projects/Assets/Febles-G1-20261023/rain-inspection.json')
data = {'objects': [], 'actions': list(bpy.data.actions.keys()), 'materials': {}}
for obj in bpy.data.objects:
    if obj.type in {'MESH', 'ARMATURE', 'CURVES'}:
        item = {'name': obj.name, 'type': obj.type, 'hidden': obj.hide_get(), 'renderHidden': obj.hide_render, 'dimensions': list(obj.dimensions), 'modifiers': [(m.name,m.type) for m in obj.modifiers]}
        if obj.type == 'ARMATURE':
            item['bones'] = list(obj.data.bones.keys())
        if obj.type == 'MESH':
            item['materials'] = [m.name for m in obj.data.materials if m]
            item['vertices'] = len(obj.data.vertices)
        data['objects'].append(item)
for mat in bpy.data.materials:
    data['materials'][mat.name] = [(n.name,n.type) for n in mat.node_tree.nodes] if mat.node_tree else []
out.write_text(json.dumps(data, indent=2))
print('INSPECTION_SAVED',out)
