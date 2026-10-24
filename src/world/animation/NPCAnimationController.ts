import { AnimationAction, AnimationMixer, LoopOnce, LoopRepeat } from 'three'

/** One owner per mixer. No transform offsets are applied to imported joints. */
export class NPCAnimationController {
  private current: AnimationAction | null = null
  private known=new Set<AnimationAction>()
  private paused=false
  private repeat=false
  constructor(private actions: Record<string, AnimationAction | null>, private mixer: AnimationMixer) {}
  play(name: string, repeat = false) {
    const next = this.actions[name]
    if (!next || (this.current === next && this.repeat === repeat)) return
    this.repeat=repeat
    this.known.add(next)
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1)
    const once=!repeat&&['Greet','Talk','PointServices','PointOrder'].includes(name)
    next.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity)
    next.clampWhenFinished = once
    next.play()
    if(!this.paused){if (this.current && this.current !== next) this.current.crossFadeTo(next, .4, false);else next.fadeIn(.4)}
    this.current = next
    if(this.paused)this.applyPausedPose()
  }
  private applyPausedPose(){
    // Drei actions are lazy getters. Enumerating all values instantiated every
    // unused clip and thousands of bindings whenever a worker was paused.
    for(const action of this.known)if(action!==this.current)action.stop()
    this.current?.stopFading().setEffectiveWeight(1)
    this.mixer.update(0)
  }
  pause(value: boolean) { this.paused=value;this.mixer.timeScale = value ? 0 : 1;if(value)this.applyPausedPose() }
  dispose() { this.mixer.stopAllAction(); this.current = null;this.known.clear() }
}
