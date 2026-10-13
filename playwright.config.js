const { defineConfig } = require('@playwright/test');
const { pathToFileURL } = require('node:url');

// Domyślnie lokalny index.html (otwierany jak dwuklikiem); APP_URL przełącza na opublikowaną wersję
const baseURL = process.env.APP_URL || pathToFileURL(__dirname + '/').href;

module.exports = defineConfig({
  testDir: 'tests',
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
  },
});
