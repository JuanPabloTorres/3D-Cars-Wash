import { distance, isWalkable, segmentClear, waypoints, type Point } from './layout'

export interface IPathPlanner {
  findPath(from: Point, to: Point): Point[] | null
}

/** Visibility graph over the pedestrian waypoints. Every edge is collision checked. */
export class WaypointPathPlanner implements IPathPlanner {
  findPath(from: Point, to: Point): Point[] | null {
    if (!isWalkable(from) || !isWalkable(to)) return null

    const nodes = [from, ...waypoints, to],
      end = nodes.length - 1
    const costs = nodes.map(() => Infinity),
      previous = nodes.map(() => -1),
      visited = new Set<number>()

    costs[0] = 0
    for (let n = 0; n < nodes.length; n++) {
      let u = -1

      costs.forEach((c, i) => {
        if (!visited.has(i) && (u < 0 || c < costs[u])) u = i
      })
      if (u < 0 || costs[u] === Infinity) break
      if (u === end) {
        const result: Point[] = []
        let cursor = end

        while (cursor !== 0) {
          result.unshift(nodes[cursor])
          cursor = previous[cursor]
        }

        return result
      }
      visited.add(u)
      nodes.forEach((node, v) => {
        if (v === u || visited.has(v) || !segmentClear(nodes[u], node)) return

        const next = costs[u] + distance(nodes[u], node)

        if (next < costs[v]) {
          costs[v] = next
          previous[v] = u
        }
      })
    }

    return null
  }
}
