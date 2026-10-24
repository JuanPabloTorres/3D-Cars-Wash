$ErrorActionPreference = 'Stop'
$taskAssetRoot = 'C:\Projects\Assets\Febles-G1-20261023'
foreach ($id in @('garden_hose_wall_mounted_01','tool_cart')) {
  $files = Invoke-RestMethod -Uri ('https://api.polyhaven.com/files/'+$id)
  $metadata = $files.gltf.'1k'
  $metadata | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $taskAssetRoot ($id+'-download.json'))
  $folder = Join-Path $taskAssetRoot $id
  New-Item -ItemType Directory -Path (Join-Path $folder 'textures') -Force | Out-Null
  $gltf = Join-Path $folder ($id+'.gltf')
  Invoke-WebRequest -Uri $metadata.gltf.url -OutFile $gltf
  foreach ($entry in $metadata.gltf.include.PSObject.Properties) {
    Invoke-WebRequest -Uri $entry.Value.url -OutFile (Join-Path $folder $entry.Name)
  }
  Write-Output ('Downloaded equipment: '+$id)
}
$publicTextures = Join-Path $PSScriptRoot '..\public\textures'
foreach ($item in @(@('concrete_floor_worn_001','concrete'),@('wood_planks','wood'))) {
  $files = Invoke-RestMethod -Uri ('https://api.polyhaven.com/files/'+$item[0])
  foreach ($map in @(@('Diffuse','color'),@('nor_gl','normal'),@('rough','roughness'))) {
    Invoke-WebRequest -Uri $files.($map[0]).'1k'.jpg.url -OutFile (Join-Path $publicTextures ($item[1]+'-'+$map[1]+'.jpg'))
  }
}
$files=Invoke-RestMethod -Uri 'https://api.polyhaven.com/files/kiara_6_afternoon'
Invoke-WebRequest -Uri $files.hdri.'1k'.hdr.url -OutFile (Join-Path $publicTextures 'daylight.hdr')
