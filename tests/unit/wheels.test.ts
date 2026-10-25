import { describe, it, expect } from 'vitest'
import { rollWheels } from '../../src/domain/wheelKinematics'
describe('distance-driven wheel rotation', () => {
  it('uses the same distance at 30 and 120 FPS', () => {
    function simulate(fps: number) {
      let angle = 0
      for (let i = 1; i <= fps; i++)
        angle = rollWheels(angle, [0, ((i - 1) * 3) / fps], [0, (i * 3) / fps], 0, 0.3)
      return angle
    }
    expect(simulate(30)).toBeCloseTo(10)
    expect(simulate(120)).toBeCloseTo(10)
  })
  it('stops at rest and reverses sign without rotating the body', () => {
    expect(rollWheels(5, [0, 1], [0, 1], 0, 0.3)).toBe(5)
    expect(rollWheels(0, [0, 3], [0, 0], 0, 0.3)).toBeCloseTo(-10)
  })
})
