/**
 * PURPOSE: Exports all E2E test harness components
 *
 * USAGE:
 * import {
 *   createCliTestDriver,
 *   createScreenCapture,
 *   createWaitStrategies,
 *   createFileSystemSpy,
 *   type CliTestDriver,
 *   type ScreenCapture,
 * } from '../../e2e/harness';
 *
 * Provides:
 * - CLI test driver for debug and full modes
 * - Screen capture with assertion utilities
 * - Wait strategies for async synchronization
 * - File system spy for tracking changes
 */

import { mkdirSync, existsSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import { writeMcpConfig, writeClaudeSettings } from './mcp-test-helpers';

// CLI Test Driver (debug mode - for widget testing via JSON protocol)
export {
  createCliTestDriver,
  KEY_CODES,
  type CliTestDriver,
  type CliTestDriverConfig,
  type DebugResponse,
  type DriverMode,
  type KeyName,
  type CliScreen,
  type StartOptions,
} from './cli-test-driver';

// Screen Capture
export {
  createScreenCapture,
  createEmptyScreenCapture,
  stripAnsiCodes,
  type ScreenCapture,
  type ScreenType,
} from './screen-capture';

// Wait Strategies
export {
  createWaitStrategies,
  delay,
  expectScreen,
  type WaitStrategies,
  type WaitConfig,
  type StabilityConfig,
  type WaitResult,
} from './wait-strategies';

// File System Spy
export {
  createFileSystemSpy,
  QUEST_DIR,
  type FileSystemSpy,
  type FileChange,
  type FileSnapshot,
  type QuestFile,
  type QuestData,
} from './file-system-spy';

// Full CLI Driver (node-pty based - for real terminal E2E testing)
export {
  createFullCliDriver,
  createE2ECliDriver,
  FULL_CLI_KEY_CODES,
  type FullCliDriver,
  type FullCliDriverConfig,
  type FullCliKeyName,
  type WaitForConfig as FullCliWaitForConfig,
} from './full-cli-driver';

// MCP Test Helpers
export {
  writeMcpConfig,
  writeClaudeSettings,
  getDefaultMcpConfig,
  type McpConfig,
  type McpServerConfig,
} from './mcp-test-helpers';

/**
 * Simple test project for E2E tests
 * A minimal implementation that doesn't depend on external packages
 */
export interface E2ETestProject {
  /** Unique name of this test project */
  name: string;
  /** Unique ID for this test instance */
  id: string;
  /** Root directory path of the test project */
  rootDir: string;
  /** Write a file to the test project */
  writeFile: (relativePath: string, content: string) => void;
  /** Check if a file exists */
  fileExists: (relativePath: string) => boolean;
  /** Clean up the test project */
  cleanup: () => void;
}

/**
 * Creates a simple test project in /tmp for E2E testing
 */
export const createE2ETestProject = (baseName: string): E2ETestProject => {
  const id = crypto.randomBytes(4).toString('hex');
  const name = `${baseName}-${id}`;
  const rootDir = join('/tmp', name);

  // Create the project directory
  if (!existsSync(rootDir)) {
    mkdirSync(rootDir, { recursive: true });
  }

  // Create basic package.json
  const packageJson = {
    name,
    version: '1.0.0',
    scripts: {
      test: 'echo "test"',
    },
  };
  writeFileSync(join(rootDir, 'package.json'), JSON.stringify(packageJson, null, 2));

  // Create .claude directory for dungeonmaster
  mkdirSync(join(rootDir, '.claude', 'commands'), { recursive: true });

  // Create .mcp.json for MCP tool access during E2E tests
  writeMcpConfig(rootDir);

  // Create .claude/settings.json with MCP permissions
  writeClaudeSettings(rootDir);

  return {
    name,
    id,
    rootDir,
    writeFile: (relativePath: string, content: string): void => {
      const fullPath = join(rootDir, relativePath);
      const dir = join(fullPath, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(fullPath, content);
    },
    fileExists: (relativePath: string): boolean => existsSync(join(rootDir, relativePath)),
    cleanup: (): void => {
      if (existsSync(rootDir)) {
        rmSync(rootDir, { recursive: true, force: true });
      }
    },
  };
};

/**
 * BDD-style test helpers for Given/When/Then structure
 */
export const given = {
  /**
   * Creates a test context with initialized driver
   */
  cliInDebugMode: (
    config: Partial<import('./cli-test-driver').CliTestDriverConfig> = {},
  ): {
    driver: import('./cli-test-driver').CliTestDriver;
    wait: import('./wait-strategies').WaitStrategies;
  } => {
    // Use synchronous imports since these are local modules
    const { createCliTestDriver } = require('./cli-test-driver') as typeof import('./cli-test-driver');
    const { createWaitStrategies } = require('./wait-strategies') as typeof import('./wait-strategies');

    const driver = createCliTestDriver({ mode: 'debug', ...config });
    const wait = createWaitStrategies(driver);

    return { driver, wait };
  },

  /**
   * Creates a test context with testbed and file system spy
   */
  isolatedEnvironment: (
    baseName: string,
  ): {
    testProject: E2ETestProject;
    spy: import('./file-system-spy').FileSystemSpy;
    cleanup: () => void;
  } => {
    const { createFileSystemSpy } = require('./file-system-spy') as typeof import('./file-system-spy');

    const testProject = createE2ETestProject(baseName);
    const spy = createFileSystemSpy(testProject.rootDir);

    return {
      testProject,
      spy,
      cleanup: () => testProject.cleanup(),
    };
  },

  /**
   * Creates a full test context with driver, wait, testbed, and spy
   */
  fullTestContext: (
    baseName: string,
  ): {
    driver: import('./cli-test-driver').CliTestDriver;
    wait: import('./wait-strategies').WaitStrategies;
    testProject: E2ETestProject;
    spy: import('./file-system-spy').FileSystemSpy;
    cleanup: () => Promise<void>;
  } => {
    const { createCliTestDriver } = require('./cli-test-driver') as typeof import('./cli-test-driver');
    const { createWaitStrategies } = require('./wait-strategies') as typeof import('./wait-strategies');
    const { createFileSystemSpy } = require('./file-system-spy') as typeof import('./file-system-spy');

    const testProject = createE2ETestProject(baseName);
    const driver = createCliTestDriver({ mode: 'debug', cwd: testProject.rootDir });
    const wait = createWaitStrategies(driver);
    const spy = createFileSystemSpy(testProject.rootDir);

    const cleanup = async (): Promise<void> => {
      await driver.stop();
      testProject.cleanup();
    };

    return { driver, wait, testProject, spy, cleanup };
  },
};

/**
 * Assertion helpers for BDD-style tests
 */
export const then = {
  /**
   * Assert screen contains text
   */
  screenContains: (
    screen: import('./screen-capture').ScreenCapture,
    text: string,
  ): void => {
    if (!screen.contains(text)) {
      throw new Error(`Expected screen to contain "${text}"\n\nActual content:\n${screen.text}`);
    }
  },

  /**
   * Assert screen does not contain text
   */
  screenNotContains: (
    screen: import('./screen-capture').ScreenCapture,
    text: string,
  ): void => {
    if (screen.contains(text)) {
      throw new Error(`Expected screen to NOT contain "${text}"\n\nActual content:\n${screen.text}`);
    }
  },

  /**
   * Assert callback was invoked
   */
  callbackWasInvoked: (
    callbacks: import('./cli-test-driver').DebugResponse['callbacks'],
    callbackName: keyof NonNullable<import('./cli-test-driver').DebugResponse['callbacks']>,
  ): void => {
    if (!callbacks?.[callbackName] || callbacks[callbackName].length === 0) {
      throw new Error(`Expected callback "${callbackName}" to be invoked but it was not`);
    }
  },

  /**
   * Assert quest was created with name pattern
   */
  questWasCreated: (
    spy: import('./file-system-spy').FileSystemSpy,
    namePattern: string,
  ): void => {
    const quests = spy.findQuestsWithName(namePattern);
    if (quests.length === 0) {
      const allQuests = spy.getAllQuests();
      const questNames = allQuests.map((q) => q.nameSlug).join(', ') || 'none';
      throw new Error(
        `Expected quest matching "${namePattern}" to be created\n\nFound quests: ${questNames}`,
      );
    }
  },
};
