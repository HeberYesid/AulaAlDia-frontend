/* global process */
import { defineConfig, devices } from '@playwright/test';

const previewPort = process.env.AULA_E2E_PREVIEW_PORT || '4173';
if (!/^\d{4,5}$/.test(previewPort) || Number(previewPort) < 1024 || Number(previewPort) > 65535) {
  throw new Error('AULA_E2E_PREVIEW_PORT debe indicar un puerto local entre 1024 y 65535.');
}
const origin = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: true,
  retries: 0,
  workers: 1,
  globalTimeout: 120_000,
  reporter: 'line',
  use: {
    baseURL: origin,
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vite preview --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: `${origin}/login`,
    reuseExistingServer: false,
  },
});
