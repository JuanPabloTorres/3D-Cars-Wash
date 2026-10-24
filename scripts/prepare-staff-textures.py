from PIL import Image
from pathlib import Path
import hashlib,json
root=Path('C:/Projects/Assets/Febles-G1-20261023')
out=root/'web-textures';out.mkdir(exist_ok=True)
mapping={}
for group in ['rain','snow']:
    for path in (root/group).rglob('*.png'):
        if not any(s in path.name.lower() for s in ['diffuse','eyes.png']):continue
        name='tex_'+hashlib.sha256(str(path).encode()).hexdigest()[:16]+'.jpg'
        target=out/name
        image=Image.open(path).convert('RGB');image.thumbnail((1024,1024));image.save(target,quality=90)
        mapping[str(path.resolve())]=str(target)
(out/'manifest.json').write_text(json.dumps(mapping,indent=2))
print('PREPARED',len(mapping),'ordinary RGB textures')
