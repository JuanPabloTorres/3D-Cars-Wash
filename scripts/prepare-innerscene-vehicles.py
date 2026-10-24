"""Adapt licensed Innerscene GLBs to the existing +Z-forward vehicle contract.
No generated replacement geometry. Retain real body, cabin, wheels and materials.
"""
import bpy,json,math,re
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[1]
source=Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/innerscene')
report=[]
for category in ['car','pickup','suv','truck']:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(source/(category+'.glb')))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 def center(o):return sum((o.matrix_world@Vector(v) for v in o.bound_box),Vector())/8
 tyre_contract={'car':'107 reused Sculpted_tyre','pickup':'107 reused Sculpted_tyre','suv':'Original tyre carcass and shaped sidewalls','truck':'Commercial tire formed sidewalls'}
 tyres=[o for o in meshes if o.name.split('.')[0]==tyre_contract[category]]
 # These originals have one sculpted tyre mesh per wheel, plus independent rim parts.
 assert len(tyres) in [4,6],(category,'Unexpected tyres',len(tyres),[o.name for o in tyres])
 centers=[center(o) for o in tyres]
 points=[o.matrix_world@Vector(v) for o in meshes for v in o.bound_box]
 lo=Vector(tuple(min(p[i] for p in points) for i in range(3)));hi=Vector(tuple(max(p[i] for p in points) for i in range(3)))
 mid=(lo+hi)/2
 wheelparts=[[] for _ in tyres];body=[];window=[]
 for o in meshes:
  c=center(o);index=min(range(len(centers)),key=lambda i:(c-centers[i]).length)
  wheelname=re.search(r'tyre|tire|alloy|rim|lug|center.cap|spoke|rotor',o.name,re.I) and not re.search(r'steering|lamp|gasket|wheelhouse|trim',o.name,re.I)
  opening=re.search(r'front.*(?:glass|glazing)',o.name,re.I) and not re.search(r'rubber|seal|sill|windscreen|windshield',o.name,re.I) and c.y>mid.y
  target=window if opening else wheelparts[index] if wheelname and (c-centers[index]).length<.62 else body
  target.append(o)
 # Source longitudinal X, front -X. Blender +90 Z maps front to -Y (glTF +Z).
 turn=Matrix.Rotation(math.pi/2,4,'Z')
 for o in meshes:
  transform=o.matrix_world.copy()
  o.parent=None
  for v in o.data.vertices:
   p=transform@v.co;p-=Vector((mid.x,mid.y,lo.z));v.co=turn@p
  o.matrix_world.identity()
 groups=[('Body',body)]
 if window:groups.append(('WindowFrontL',window))
 for i,parts in enumerate(wheelparts):
  c=centers[i];label='Wheel'+('Front' if c.x<mid.x else 'Rear')+('L' if c.y>mid.y else 'R')
  if any(name==label for name,_ in groups):label+='2'
  groups.append((label,parts))
 for label,objects in groups:
  assert objects,(category,label,'empty group')
  bpy.ops.object.select_all(action='DESELECT')
  for o in objects:o.select_set(True)
  bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();joined=bpy.context.object;joined.name=label
  # Apply only joins; keep the authored curvature/normals, UVs, textures and cabin.
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:
  if o.type=='MESH':o.select_set(True)
 dest=root/'public/models'/('vehicle-'+category+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',use_selection=True,export_animations=False,export_extras=False)
 report.append({'category':category,'source':str(source/(category+'.glb')),'sourceDimensions':list(hi-lo),'wheels':[name for name,_ in groups if name.startswith('Wheel')],'bytes':dest.stat().st_size})
Path('C:/Projects/Assets/Febles-Visual-Revision-20261023/innerscene-adaptation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
