// playwright.config.js
// Used by the A4 dataLayer validator CI workflow.
// TEST_URL is injected by GitHub Actions from the PR environment.
//
// Optional basic-auth for password-protected staging environments:
//   TEST_USERNAME and TEST_PASSWORD — extracted from PR description by the workflow.
//   If not provided, httpCredentials is omitted and no auth is attempted.

import { defineConfig } from '@playwright/test';

const credentials =
  process.env.TEST_USERNAME && process.env.TEST_PASSWORD
    ? { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD }
    : undefined;

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 30_000,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.TEST_URL,
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Basic-auth for password-protected staging URLs (optional)
    ...(credentials ? { httpCredentials: credentials } : {}),
    // Capture traces only on failure to keep CI fast
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
