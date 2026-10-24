import {NodeIO}from'@gltf-transform/core';import{ALL_EXTENSIONS}from'@gltf-transform/extensions';import{flatten,join,prune}from'@gltf-transform/functions';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),doc=await io.read('public/models/vehicle.glb'),buffer=doc.getRoot().listBuffers()[0],animation=doc.createAnimation('Wheel pivot preservation');
const input=doc.createAccessor().setType('SCALAR').setArray(new Float32Array([0,1])).setBuffer(buffer);
const roots=doc.getRoot().listNodes().filter(n=>/^Wheel(Front|Rear)[LR]$/.test(n.getName()));if(roots.length!==4)throw Error('Four wheel roots required');
for(const node of roots){const q=node.getRotation(),output=doc.createAccessor().setType('VEC4').setArray(new Float32Array([...q,...q])).setBuffer(buffer),sampler=doc.createAnimationSampler().setInput(input).setOutput(output).setInterpolation('LINEAR');animation.addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('rotation').setSampler(sampler))}
await doc.transform(flatten(),join({filter:node=>{for(let n=node;n;n=n.getParentNode())if(/^Wheel(Front|Rear)/.test(n.getName()))return false;return true}}));
for(const channel of animation.listChannels())channel.dispose();animation.dispose();for(const s of doc.getRoot().listAnimationSamplers?.()||[])s.dispose();await doc.transform(prune());
const preserved=doc.getRoot().listNodes().filter(n=>/^Wheel(Front|Rear)[LR]$/.test(n.getName()));if(preserved.length!==4)throw Error('Wheel roots lost');
await io.write('public/models/vehicle.glb',doc);console.log({wheelAssemblies:preserved.length,primitives:doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().length,0)});
