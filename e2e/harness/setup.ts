/**
 * PURPOSE: Jest setup file for E2E tests - handles global cleanup
 *
 * USAGE:
 * Referenced in jest.config.js setupFilesAfterEnv
 */

import * as fs from 'fs';

const E2E_TEMP_BASE = '/tmp/dungeonmaster-e2e';

// Clean up any orphaned temp directories from previous runs
beforeAll(() => {
  if (fs.existsSync(E2E_TEMP_BASE)) {
    const dirs = fs.readdirSync(E2E_TEMP_BASE);
    // Only clean up directories older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const dir of dirs) {
      const dirPath = `${E2E_TEMP_BASE}/${dir}`;
      const stat = fs.statSync(dirPath);
      if (stat.mtimeMs < oneHourAgo) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    }
  }
});

// Increase default timeout for all tests
jest.setTimeout(300000);
