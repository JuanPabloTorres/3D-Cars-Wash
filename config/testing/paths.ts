import { fileURLToPath } from 'node:url'

/** Test paths remain rooted in the repository after grouping runner configs. */
export const projectPath = (relative: string) =>
  fileURLToPath(new URL(`../../${relative}`, import.meta.url))
