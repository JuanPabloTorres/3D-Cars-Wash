import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import type { PricingConfiguration } from '../src/domain/businessContent.ts'

/** Local SQLite adapter. Repositories share transactions, never business rules. */
export abstract class SqliteRepository {
  constructor(protected readonly db: DatabaseSync) {}

  protected transaction<T>(work: () => T): T {
    this.db.exec('BEGIN IMMEDIATE')
    try {
      const result = work()

      this.db.exec('COMMIT')

      return result
    } catch (error) {
      this.db.exec('ROLLBACK')
      throw error
    }
  }

  protected read<T>(key: string): T | null {
    const row = this.db.prepare('SELECT payload FROM records WHERE id=?').get(key)

    return row ? (JSON.parse(String(row.payload)) as T) : null
  }

  protected write(key: string, value: unknown) {
    this.db
      .prepare(
        'INSERT INTO records(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload',
      )
      .run(key, JSON.stringify(value))
  }
}

export interface CatalogStore {
  load(): PricingConfiguration | null
  save(value: PricingConfiguration, expectedVersion?: string): void
}

export class CatalogRepository extends SqliteRepository implements CatalogStore {
  load() {
    return this.read<PricingConfiguration>('catalog')
  }

  save(value: PricingConfiguration, expectedVersion?: string) {
    this.transaction(() => {
      const previous = this.load()

      if (expectedVersion && previous?.version !== expectedVersion)
        throw new Error('La configuración cambió. Recarga antes de guardar.')
      this.write('catalog', value)
    })
  }
}

export class RuntimeRepository extends SqliteRepository {
  load<T>() {
    return this.read<T>('runtime')
  }

  save(value: unknown) {
    this.write('runtime', value)
  }
}

export function openDatabase(
  path = process.env.CARWASH_DB_PATH || resolve('server/data/carwash.sqlite'),
) {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true })

  const db = new DatabaseSync(path)

  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY,payload TEXT NOT NULL) STRICT;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','employee','customer')),password_hash TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL) STRICT;`)

  // SQLite cannot alter a CHECK constraint. Rebuild atomically while preserving
  // IDs and password hashes; old local installations gain the customer role.
  const schema = String(db.prepare("SELECT sql FROM sqlite_master WHERE name='users'").get()?.sql)

  if (!schema.includes("'customer'")) {
    try {
      db.exec(`BEGIN IMMEDIATE;
      ALTER TABLE users RENAME TO users_v1;
      CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','employee','customer')),password_hash TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL) STRICT;
      INSERT INTO users SELECT * FROM users_v1;
      DROP TABLE users_v1;
      COMMIT;`)
    } catch (error) {
      try {
        db.exec('ROLLBACK')
      } finally {
        db.close()
      }
      throw error
    }
  }
  db.exec('PRAGMA user_version=2')

  return db
}
