import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 6,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    // Fast timeouts
    actionTimeout: 2000,
    navigationTimeout: 5000,
  },
  
  // Global test timeout
  timeout: 10000,
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 5000,
  },
});