import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000', headless: true, launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {} },
  webServer: [
    { command: 'npm run dev -- --port 3000', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI, timeout: 120_000 },
    { command: 'cd backEnd/_management && php artisan serve --host=127.0.0.1 --port=8000', url: 'http://127.0.0.1:8000/up', reuseExistingServer: !process.env.CI, timeout: 120_000 },
  ],
})
