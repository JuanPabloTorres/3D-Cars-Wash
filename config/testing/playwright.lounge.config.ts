import { projectPath } from './paths.ts'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: projectPath('tests/e2e'),
  testMatch: 'waiting-lounge.spec.ts',
  timeout: 360000,
  expect: { timeout: 20000 },
  workers: 1,
  outputDir: projectPath('docs/evidence/phase05/test-results'),
  reporter: [['list']],
  use: {
    actionTimeout: 20000,
    navigationTimeout: 60000,
    baseURL: 'http://127.0.0.1:4174',
    channel: 'msedge',
    headless: true,
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
})
