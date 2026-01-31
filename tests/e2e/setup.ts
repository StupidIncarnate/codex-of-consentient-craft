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
import { existsSync } from 'fs';
import * as path from 'path';
import { resolve } from 'path';

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
function setupEnvironment(): void {
  for (const [key, value] of Object.entries(E2E_ENV_VARS)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/**
 * Clean up all testbed directories created during E2E tests
 */
function cleanupTestbeds(): void {
  if (fs.existsSync(E2E_TESTBED_ROOT)) {
    try {
      // Get all directories in testbed root
      const entries = fs.readdirSync(E2E_TESTBED_ROOT, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(E2E_TESTBED_ROOT, entry.name);
          try {
            fs.rmSync(dirPath, { recursive: true, force: true });
          } catch (error) {
            // Log but don't fail - cleanup is best effort
            console.warn(`Failed to clean up testbed directory: ${dirPath}`, error);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to clean up testbed root:', error);
    }
  }
}

/**
 * Ensure testbed root directory exists
 */
function ensureTestbedRoot(): void {
  if (!fs.existsSync(E2E_TESTBED_ROOT)) {
    fs.mkdirSync(E2E_TESTBED_ROOT, { recursive: true });
  }
}

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
    console.log('\n========================================');
    console.log('E2E Test Environment');
    console.log('========================================');
    console.log(`Testbed Root: ${E2E_TESTBED_ROOT}`);
    console.log(`Node Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`CI Mode: ${process.env.CI}`);
    console.log('========================================\n');
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
    console.log(`\nTestbeds preserved at: ${E2E_TESTBED_ROOT}`);
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
export function createE2ETestDir(testName: string): string {
  const timestamp = Date.now();
  const sanitizedName = testName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const dirName = `e2e-${sanitizedName}-${timestamp}`;
  const dirPath = path.join(E2E_TESTBED_ROOT, dirName);

  fs.mkdirSync(dirPath, { recursive: true });

  return dirPath;
}

// Export helper for checking if Claude CLI is available
export async function isClaudeAvailable(): Promise<boolean> {
  const { execSync } = await import('child_process');
  try {
    execSync('claude --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if MCP server entry point exists
 */
export function isMcpServerAvailable(): boolean {
  const mcpServerPath = resolve(__dirname, '../../packages/mcp/src/index.ts');
  return existsSync(mcpServerPath);
}

/**
 * Check if MCP tools are available for E2E testing
 * Now auto-enabled when MCP server is available (no explicit opt-in needed)
 */
export function isMcpTestingEnabled(): boolean {
  // Allow explicit opt-out
  if (process.env['SKIP_MCP_TESTS'] === 'true') {
    return false;
  }

  // MCP is enabled if server is available
  return isMcpServerAvailable();
}

// Export helper for skipping tests when Claude is not available
export function skipIfNoClaudeAvailable(
  testFn: () => void | Promise<void>,
): () => void | Promise<void> {
  return async () => {
    const available = await isClaudeAvailable();
    if (!available) {
      console.warn('Claude CLI not available, skipping test');
      return;
    }
    return testFn();
  };
}
