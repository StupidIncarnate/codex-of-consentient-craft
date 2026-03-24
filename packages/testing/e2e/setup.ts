/**
 * E2E Test Setup and Teardown
 *
 * Provides:
 * - Global setup/teardown for E2E test environment
 * - Testbed cleanup after tests
 * - Environment variables for headless mode
 * - Test isolation utilities
 */

import * as fs from 'fs';
import * as path from 'path';

import type { FilePath } from '@dungeonmaster/shared/contracts';

// Testbed directory for E2E tests
const E2E_TESTBED_ROOT = path.join(__dirname, '..', 'tmp');

// Environment variables for headless Claude execution
const E2E_ENV_VARS = {
  // Force non-interactive mode
  CI: 'true',
  // Disable color output for cleaner logs
  NO_COLOR: '1',
  // Force headless mode
  FORCE_HEADLESS: '1',
  // Set default model for E2E tests
  CLAUDE_MODEL: 'sonnet',
} as const;

/**
 * Set up environment variables for E2E tests
 */
const setupEnvironment = (): void => {
  for (const [key, value] of Object.entries(E2E_ENV_VARS)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

/**
 * Clean up all testbed directories created during E2E tests
 */
const cleanupTestbeds = (): void => {
  if (fs.existsSync(E2E_TESTBED_ROOT)) {
    try {
      // Get all directories in testbed root
      const entries = fs.readdirSync(E2E_TESTBED_ROOT, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(E2E_TESTBED_ROOT, entry.name);
          try {
            fs.rmSync(dirPath, { recursive: true, force: true });
          } catch {
            // Cleanup is best effort — directory may be locked or already removed
          }
        }
      }
    } catch {
      // Testbed root may not exist or may be inaccessible
    }
  }
};

/**
 * Ensure testbed root directory exists
 */
const ensureTestbedRoot = (): void => {
  if (!fs.existsSync(E2E_TESTBED_ROOT)) {
    fs.mkdirSync(E2E_TESTBED_ROOT, { recursive: true });
  }
};

/**
 * Global setup - runs before all E2E tests
 */
beforeAll(() => {
  // Set up environment for headless mode
  setupEnvironment();

  // Ensure testbed directory exists
  ensureTestbedRoot();

  // Log E2E test environment info
  if (process.env.DEBUG_E2E === 'true') {
    process.stderr.write('\n========================================\n');
    process.stderr.write('E2E Test Environment\n');
    process.stderr.write('========================================\n');
    process.stderr.write(`Testbed Root: ${E2E_TESTBED_ROOT}\n`);
    process.stderr.write(`Node Version: ${process.version}\n`);
    process.stderr.write(`Platform: ${process.platform}\n`);
    process.stderr.write(`CI Mode: ${process.env.CI ?? 'undefined'}\n`);
    process.stderr.write('========================================\n\n');
  }
});

/**
 * Global teardown - runs after all E2E tests
 */
afterAll(() => {
  // Clean up testbed directories unless KEEP_TESTBEDS is set
  if (process.env.KEEP_TESTBEDS !== 'true') {
    cleanupTestbeds();
  } else if (process.env.DEBUG_E2E === 'true') {
    process.stderr.write(`\nTestbeds preserved at: ${E2E_TESTBED_ROOT}\n`);
  }
});

/**
 * Per-test cleanup
 */
afterEach(() => {
  // Any per-test cleanup can be added here
  // The base jest.setup.js already handles mock cleanup
});

// Export utilities for use in E2E tests
export { E2E_TESTBED_ROOT, E2E_ENV_VARS, cleanupTestbeds, ensureTestbedRoot };

// Export helper for creating isolated test directories
export const createE2ETestDir = ({ testName }: { testName: string }): { dirPath: FilePath } => {
  const timestamp = Date.now();
  const sanitizedName = testName.replace(/[^a-zA-Z0-9\-_]/gu, '-').toLowerCase();
  const dirName = `e2e-${sanitizedName}-${timestamp}`;
  const dirPath = path.join(E2E_TESTBED_ROOT, dirName) as FilePath;

  fs.mkdirSync(dirPath, { recursive: true });

  return { dirPath };
};
