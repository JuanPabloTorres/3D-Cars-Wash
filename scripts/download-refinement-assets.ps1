$destination='C:\Projects\Assets\Febles-Refinement-20261023'
New-Item -ItemType Directory -Force $destination | Out-Null
$records=@()
foreach($id in @('potted_plant_04','fern_02','calathea_orbifolia_01','island_tree_02','painted_wooden_bench')) {
 $info=Invoke-RestMethod "https://api.polyhaven.com/info/$id"
 $files=Invoke-RestMethod "https://api.polyhaven.com/files/$id"
 $entry=$files.gltf.'1k'.gltf
 if(!$entry){throw "No glTF for $id"}
 $dir=Join-Path $destination $id
 New-Item -ItemType Directory -Force $dir | Out-Null
 Invoke-WebRequest $entry.url -OutFile (Join-Path $dir "$id.gltf")
 foreach($prop in $entry.include.PSObject.Properties){
  $path=Join-Path $dir $prop.Name
  New-Item -ItemType Directory -Force (Split-Path $path) | Out-Null
  Invoke-WebRequest $prop.Value.url -OutFile $path
  if((Get-FileHash -LiteralPath $path -Algorithm MD5).Hash.ToLower() -ne $prop.Value.md5){throw 'Hash mismatch'}
 }
 $records+=@{id=$id;author=$info.authors;source="https://polyhaven.com/a/$id";license='CC0-1.0';price=0;format='glTF 2.0 + 1K PBR';metadata=$info}
 Write-Output "Downloaded $id"
}
$records | ConvertTo-Json -Depth 15 | Set-Content (Join-Path $destination 'provenance.json')
