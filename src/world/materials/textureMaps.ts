import { NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

/** Sampling settings belong to the surface, never to Drei's cached source map. */
export interface SurfaceMapOptions {
  repeat: readonly [number, number]
  offset?: readonly [number, number]
  rotation?: number
  anisotropy?: number
}

/** Clone an ordered color/normal/roughness set without changing cached textures.
 * Callers own and must dispose the returned clones. Repeat is UV density, not
 * world dimensions; metre-based callers convert dimensions before calling.
 */
export function cloneSurfaceMaps(
  sources: readonly Texture[],
  options: SurfaceMapOptions,
): Texture[] {
  return sources.map((source, index) => {
    const texture = source.clone()

    texture.wrapS = texture.wrapT = RepeatWrapping
    texture.colorSpace = index === 0 ? SRGBColorSpace : NoColorSpace
    texture.repeat.set(...options.repeat)
    if (options.offset) texture.offset.set(...options.offset)
    if (options.rotation !== undefined) texture.rotation = options.rotation
    texture.anisotropy = options.anisotropy ?? 8
    texture.needsUpdate = true

    return texture
  })
}
