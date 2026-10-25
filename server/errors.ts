/** Only explicit domain errors are safe to expose; SQLite/internal failures are not. */
export class ValidationError extends Error {
  readonly status = 422
}
