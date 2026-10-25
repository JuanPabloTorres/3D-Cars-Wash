import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { SignJWT, jwtVerify } from 'jose'

const issuer = 'urn:carwash:local',
  audience = 'urn:carwash:api'

/** Separate signing key, persisted beside SQLite and never returned by the API.
 * Exclusive creation avoids replacing the key if two processes start together. */
export function loadSessionKey(databasePath: string): Uint8Array {
  if (databasePath === ':memory:') return randomBytes(32)

  const path = resolve(databasePath) + '.jwt-key'

  mkdirSync(dirname(path), { recursive: true })
  try {
    writeFileSync(path, randomBytes(32), { flag: 'wx', mode: 0o600 })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }

  const key = readFileSync(path)

  if (key.length !== 32)
    throw new Error('La clave JWT local no es válida; restaura su copia segura.')

  return key
}

/** JWT proves identity; the persisted session and user repository still own
 * revocation and roles. No role, password, name or order is stored in the token. */
export class SessionTokens {
  constructor(private readonly key: Uint8Array) {
    if (key.byteLength !== 32) throw new Error('JWT requires a 256-bit key.')
  }

  issue(sessionId: string, subject: string, expires: number) {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setSubject(subject)
      .setJti(sessionId)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expires / 1000))
      .sign(this.key)
  }

  async verify(
    token: string,
    now = new Date(),
  ): Promise<{ sessionId: string; subject: string } | null> {
    if (token.length > 4096) return null
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ['HS256'],
        typ: 'JWT',
        issuer,
        audience,
        requiredClaims: ['sub', 'jti', 'iat', 'exp'],
        maxTokenAge: '24h',
        currentDate: now,
      })

      if (
        typeof payload.jti !== 'string' ||
        typeof payload.sub !== 'string' ||
        !payload.jti ||
        !payload.sub
      )
        return null

      return { sessionId: payload.jti, subject: payload.sub }
    } catch {
      return null
    }
  }
}
