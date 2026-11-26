import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: process.env.PW_BASE ?? 'http://127.0.0.1:5173', trace: 'retain-on-failure', channel: process.env.PW_CHANNEL ?? 'chrome' },
  webServer: process.env.PW_BASE
    ? undefined
    : {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
