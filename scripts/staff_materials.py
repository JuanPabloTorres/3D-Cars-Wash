"""Explicit portable PBR mapping; never inherit source object shader overrides.
UDIM faces select ordinary RGB tile images prepared outside Blender.
"""
from pathlib import Path
import bpy,json,math
class StaffMaterials:
    def __init__(self,role):
        self.role=role;self.cache={}
        self.files=json.loads(Path('C:/Projects/Assets/Febles-G1-20261023/web-textures/manifest.json').read_text())
    def image_for(self,label,tile):
        prefix='rain' if self.role=='receptionist' else 'snow'
        label=label.lower()
        wanted=None
        if any(s in label for s in ['body','skin']):wanted=('body_diffuse' if prefix=='rain' else 'skin_diffuse')+'.'+str(tile)
        elif 'hair' in label and 'band' not in label:wanted='hair_diffuse'
        elif 'eyes' in label and not any(s in label for s in ['cornea','iris','pupil','white']):wanted='rain_eyes.png' if prefix=='rain' else 'eyes_diffuse'
        elif any(s in label for s in ['jeans','pants']):wanted='jeans_diffuse' if prefix=='rain' else 'pants_diffuse'
        elif 'shoe' in label:wanted='shoes_diffuse' if prefix=='snow' else None
        if not wanted:return None
        match=next((dst for src,dst in self.files.items() if '/'+prefix+'/' in src.replace('\\','/') and wanted in Path(src).name.lower()),None)
        return match
    def material(self,label,tile):
        key=(label,tile)
        if key in self.cache:return self.cache[key]
        m=bpy.data.materials.new('WebPBR-'+label+'-'+str(tile));m.use_nodes=True
        p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=.58
        name=label.lower();color=(.58,.29,.17,1)
        if any(s in name for s in ['hair','eyebrow','eyelash']):color=(.035,.015,.008,1)
        if any(s in name for s in ['top','shirt']):color=(.045,.055,.065,1)
        if any(s in name for s in ['jeans','pants','shoes','shoe','laces']):color=(.045,.06,.075,1)
        if any(s in name for s in ['scarf','hairband']):color=(.55,.025,.035,1)
        if 'teeth' in name:color=(.85,.85,.78,1)
        if any(s in name for s in ['tongue','gums','lip']):color=(.34,.065,.055,1)
        if any(s in name for s in ['iris','pupil']):color=(.035,.022,.015,1)
        if self.role=='worker' and 'iris' in name:color=(.12,.045,.01,1)
        if self.role=='worker' and 'pupil' in name:color=(.003,.003,.003,1)
        if 'white' in name:color=(.9,.88,.83,1)
        p.inputs['Base Color'].default_value=color
        path=self.image_for(label,tile)
        if path:
            image=bpy.data.images.load(path,check_existing=True)
            assert image.source=='FILE' and min(image.size)>0,(path,image.source)
            tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
            m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
            # Skin images are applied directly; do not multiply them by a tint.
        self.cache[key]=m;return m
    def assign(self,mesh,original):
        labels=[s.material.name if s.material else 'skin' for s in original.material_slots] or ['eyes_white' if 'eye' in original.name.lower() else 'skin']
        uv=mesh.uv_layers.active
        indices={};slots=[];polygon_indices=[]
        for poly in mesh.polygons:
            coordinate=uv.data[poly.loop_indices[0]].uv if uv else (0,0)
            tile=1001+math.floor(coordinate[0])+10*math.floor(coordinate[1])
            key=(labels[min(poly.material_index,len(labels)-1)],tile)
            if key not in indices:indices[key]=len(slots);slots.append(self.material(*key))
            polygon_indices.append(indices[key])
        mesh.materials.clear()
        for m in slots:mesh.materials.append(m)
        # Blender resets polygon indices when material slots are cleared.
        # Apply the saved mapping only after every replacement slot exists.
        for poly,index in zip(mesh.polygons,polygon_indices):poly.material_index=index
        for layer in mesh.uv_layers:
            for loop in layer.data:loop.uv.x%=1;loop.uv.y%=1
