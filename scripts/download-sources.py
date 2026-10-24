"""Fresh official downloads only. No previous application or archived art is read."""
from pathlib import Path
from urllib.request import urlopen, Request
from concurrent.futures import ThreadPoolExecutor
import zipfile
root=Path('C:/Projects/Assets/Febles-G1-20261023')
root.mkdir(parents=True,exist_ok=True)
public=Path(__file__).resolve().parents[1]/'public'
(public/'models').mkdir(parents=True,exist_ok=True)
(public/'textures').mkdir(exist_ok=True)
def get(url,path):
    if path.exists():return
    with urlopen(Request(url,headers={'User-Agent':'Febles local prototype asset preparation'}),timeout=90) as r:path.write_bytes(r.read())
    print('DOWNLOADED',path.name,path.stat().st_size,flush=True)
def zipped(url,name):
    path=root/(name+'.zip'); get(url,path)
    with zipfile.ZipFile(path) as z:z.extractall(root/name)
jobs=[
 ('https://studio.blender.org/download-source/files/ee/a7/eea73e55dba1cea31c09848df6a794b2-4.zip','rain'),
 ('https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip','nature'),
 ('https://studio.blender.org/download-source/files/ba/0f/ba0fe6d810333b1d73c1c359e4dc03cb-6.zip','snow')]
with ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(lambda j:zipped(*j),jobs))
get('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb',root/'car-concept.glb')
print('For Poly Haven resources, run download-pbr.ps1. No API keys are used.')
