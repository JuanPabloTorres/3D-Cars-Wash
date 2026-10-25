import { initialConfiguration, validateConfiguration } from './configuration.ts'
import {
  CatalogRepository,
  RuntimeRepository,
  openDatabase,
  type CatalogStore,
} from './persistence.ts'
import { AuthenticationService, UserRepository } from './users.ts'
import { randomUUID } from 'node:crypto'
import type { PricingConfiguration } from '../src/domain/businessContent.ts'
import { SessionTokens, loadSessionKey } from './sessionTokens.ts'
import { resolve } from 'node:path'

/** Validates catalog writes while the repository enforces optimistic versions. */
export class CatalogService {
  constructor(private readonly repository: CatalogStore) {}

  /** Seed once on an empty store; existing persisted settings always win. */
  load() {
    let config = this.repository.load()

    if (!config) {
      config = initialConfiguration()
      this.repository.save(config)
    }

    return config
  }

  /** Save a validated revision or propagate a stale-version/validation error. */
  update(input: PricingConfiguration, expectedVersion: string) {
    const next = validateConfiguration(input)

    next.version = randomUUID()
    this.repository.save(next, expectedVersion)

    return next
  }
}

/** Composition root: one database shared by repositories and injected services. */
export function createLocalServices(
  path = process.env.CARWASH_DB_PATH || resolve('server/data/carwash.sqlite'),
) {
  const tokens = new SessionTokens(loadSessionKey(path))
  const db = openDatabase(path),
    users = new UserRepository(db)

  return {
    catalog: new CatalogService(new CatalogRepository(db)),
    runtime: new RuntimeRepository(db),
    users,
    auth: new AuthenticationService(users),
    tokens,
    close: () => db.close(),
  }
}
