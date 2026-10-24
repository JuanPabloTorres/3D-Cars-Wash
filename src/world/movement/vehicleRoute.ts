import type{Point}from '../navigation/layout'
/** Pure movement helper retained for navigation regressions; traffic uses sitePlan routes. */
export function advanceToward(from:Point,to:Point,maxDistance:number):Point{const d=Math.hypot(to[0]-from[0],to[1]-from[1]);const t=d?Math.min(1,maxDistance/d):1;return [from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t]}
