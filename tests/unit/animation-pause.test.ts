import {it,expect} from 'vitest'
import {AnimationMixer,AnimationClip,NumberKeyframeTrack,Group} from 'three'
import {NPCAnimationController} from '../../src/world/animation/NPCAnimationController'
it('displays a deliberate work pose when a paused stage mounts or changes',()=>{
 const root=new Group(),mixer=new AnimationMixer(root),a=new AnimationClip('Service',1,[new NumberKeyframeTrack('.rotation[x]',[0,1],[.5,.7])]),b=new AnimationClip('ServiceLights',1,[new NumberKeyframeTrack('.rotation[x]',[0,1],[.9,1])])
 const controller=new NPCAnimationController({Service:mixer.clipAction(a),ServiceLights:mixer.clipAction(b)},mixer)
 controller.play('Service');controller.pause(true);expect(root.rotation.x).toBeCloseTo(.5)
 controller.play('ServiceLights');expect(root.rotation.x).toBeCloseTo(.9)
 mixer.update(.5);expect(root.rotation.x).toBeCloseTo(.9)
 controller.pause(false);mixer.update(.5);expect(root.rotation.x).toBeGreaterThan(.9);controller.dispose()
})
it('does not instantiate unused lazy animation clips when pausing',()=>{
 const root=new Group(),mixer=new AnimationMixer(root),clip=new AnimationClip('Idle',1,[new NumberKeyframeTrack('.rotation[x]',[0,1],[0,.1])])
 const actions={Idle:mixer.clipAction(clip),get Unused():never{throw new Error('An unused clip must remain lazy')}}
 const controller=new NPCAnimationController(actions,mixer);controller.play('Idle');expect(()=>controller.pause(true)).not.toThrow();controller.dispose()
})
