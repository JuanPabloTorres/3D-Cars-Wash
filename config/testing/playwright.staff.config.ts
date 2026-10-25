import { projectPath } from './paths.ts'
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: projectPath('tests/e2e'),
  testMatch: 'staff-integration.spec.ts',
  workers: 1,
  timeout: 360000,
  expect: { timeout: 20000 },
  reporter: 'list',
  outputDir: projectPath('.cache/staff-test-results'),
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
  },
})
