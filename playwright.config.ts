import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Records test.db's waypoint positions; tests/keep-positions.ts restores them.
  globalSetup: './tests/snapshot-positions.ts',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'dotenv -e .env.test -- next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
});
