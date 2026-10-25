import { projectPath } from './paths.ts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: projectPath(''),
  test: { include: ['tests/unit/**/*.test.ts'] },
})
