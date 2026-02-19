/**
 * PURPOSE: Provides async waiting utilities for E2E test synchronization
 *
 * USAGE:
 * const wait = createWaitStrategies(driver);
 * await wait.forText('Welcome');
 * await wait.forNoText('Loading');
 * await wait.forScreen('menu');
 * await wait.forStable();
 *
 * Provides:
 * - Configurable timeout and polling intervals
 * - Text presence/absence waiting
 * - Screen type waiting
 * - Stability detection (no changes for N ms)
 */

import type { CliTestDriver } from './cli-test-driver';
import type { ScreenCapture, ScreenType } from './screen-capture';

/**
 * Configuration for wait operations
 */
export interface WaitConfig {
  /** Maximum time to wait in milliseconds (default: 5000) */
  timeout?: number;
  /** Interval between checks in milliseconds (default: 100) */
  interval?: number;
  /** Custom error message on timeout */
  message?: string;
}

/**
 * Configuration for stability waiting
 */
export interface StabilityConfig extends WaitConfig {
  /** Time the screen must remain unchanged in milliseconds (default: 500) */
  stableFor?: number;
}

/**
 * Result of a wait operation
 */
export interface WaitResult {
  /** Whether the wait condition was met */
  success: boolean;
  /** The screen capture when condition was met (or last capture on timeout) */
  screen: ScreenCapture;
  /** Time elapsed in milliseconds */
  elapsed: number;
  /** Error message if timed out */
  error?: string;
}

/**
 * Wait strategy utilities for CLI testing
 */
export interface WaitStrategies {
  /** Wait for text to appear on screen */
  forText: (text: string, config?: WaitConfig) => Promise<WaitResult>;
  /** Wait for text to disappear from screen */
  forNoText: (text: string, config?: WaitConfig) => Promise<WaitResult>;
  /** Wait for a specific screen type */
  forScreen: (screenType: ScreenType, config?: WaitConfig) => Promise<WaitResult>;
  /** Wait for screen to stabilize (no changes) */
  forStable: (config?: StabilityConfig) => Promise<WaitResult>;
  /** Wait for a custom condition */
  forCondition: (
    condition: (screen: ScreenCapture) => boolean,
    config?: WaitConfig,
  ) => Promise<WaitResult>;
  /** Wait for a regex pattern to match */
  forPattern: (pattern: RegExp, config?: WaitConfig) => Promise<WaitResult>;
  /** Simple delay (use sparingly, prefer condition-based waits) */
  delay: (ms: number) => Promise<void>;
}

// Default configuration values
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_INTERVAL_MS = 100;
const DEFAULT_STABLE_FOR_MS = 500;

/**
 * Creates a wait strategies instance bound to a CLI test driver
 */
export const createWaitStrategies = (driver: CliTestDriver): WaitStrategies => {
  /**
   * Generic wait implementation with polling
   */
  const waitFor = async (
    condition: (screen: ScreenCapture) => boolean,
    config: WaitConfig = {},
  ): Promise<WaitResult> => {
    const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    const interval = config.interval ?? DEFAULT_INTERVAL_MS;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const screen = driver.getScreen();

      if (condition(screen)) {
        return {
          success: true,
          screen,
          elapsed: Date.now() - startTime,
        };
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Timeout reached
    const finalScreen = driver.getScreen();
    const defaultMessage = config.message ?? 'Wait condition not met within timeout';

    return {
      success: false,
      screen: finalScreen,
      elapsed: Date.now() - startTime,
      error: `${defaultMessage} (${timeout}ms)`,
    };
  };

  const strategies: WaitStrategies = {
    forText: async (text: string, config?: WaitConfig): Promise<WaitResult> =>
      waitFor((screen) => screen.contains(text), {
        ...config,
        message: config?.message ?? `Text "${text}" not found on screen`,
      }),

    forNoText: async (text: string, config?: WaitConfig): Promise<WaitResult> =>
      waitFor((screen) => screen.notContains(text), {
        ...config,
        message: config?.message ?? `Text "${text}" still present on screen`,
      }),

    forScreen: async (screenType: ScreenType, config?: WaitConfig): Promise<WaitResult> =>
      waitFor((screen) => screen.isScreen(screenType), {
        ...config,
        message: config?.message ?? `Screen type "${screenType}" not detected`,
      }),

    forCondition: async (
      condition: (screen: ScreenCapture) => boolean,
      config?: WaitConfig,
    ): Promise<WaitResult> => waitFor(condition, config),

    forPattern: async (pattern: RegExp, config?: WaitConfig): Promise<WaitResult> =>
      waitFor((screen) => screen.matches(pattern), {
        ...config,
        message: config?.message ?? `Pattern ${String(pattern)} not matched`,
      }),

    forStable: async (config?: StabilityConfig): Promise<WaitResult> => {
      const timeout = config?.timeout ?? DEFAULT_TIMEOUT_MS;
      const interval = config?.interval ?? DEFAULT_INTERVAL_MS;
      const stableFor = config?.stableFor ?? DEFAULT_STABLE_FOR_MS;
      const startTime = Date.now();

      let lastContent = '';
      let stableStartTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const screen = driver.getScreen();
        const currentContent = screen.text;

        if (currentContent === lastContent) {
          // Content unchanged
          if (Date.now() - stableStartTime >= stableFor) {
            return {
              success: true,
              screen,
              elapsed: Date.now() - startTime,
            };
          }
        } else {
          // Content changed, reset stability timer
          lastContent = currentContent;
          stableStartTime = Date.now();
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
      }

      // Timeout reached
      const finalScreen = driver.getScreen();
      return {
        success: false,
        screen: finalScreen,
        elapsed: Date.now() - startTime,
        error: config?.message ?? `Screen did not stabilize for ${stableFor}ms within ${timeout}ms`,
      };
    },

    delay: async (ms: number): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, ms));
    },
  };

  return strategies;
};

/**
 * Standalone delay utility (when driver is not available)
 */
export const delay = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Helper to create wait assertions for BDD-style tests
 */
export const expectScreen = (
  screen: ScreenCapture,
): {
  toContain: (text: string) => void;
  toNotContain: (text: string) => void;
  toMatch: (pattern: RegExp) => void;
  toBeScreen: (screenType: ScreenType) => void;
} => ({
  toContain: (text: string): void => {
    if (!screen.contains(text)) {
      throw new Error(`Expected screen to contain "${text}" but it did not.\nScreen content:\n${screen.text}`);
    }
  },
  toNotContain: (text: string): void => {
    if (screen.contains(text)) {
      throw new Error(`Expected screen to NOT contain "${text}" but it did.\nScreen content:\n${screen.text}`);
    }
  },
  toMatch: (pattern: RegExp): void => {
    if (!screen.matches(pattern)) {
      throw new Error(`Expected screen to match ${String(pattern)} but it did not.\nScreen content:\n${screen.text}`);
    }
  },
  toBeScreen: (screenType: ScreenType): void => {
    const detected = screen.getScreenType();
    if (detected !== screenType) {
      throw new Error(`Expected screen type "${screenType}" but detected "${detected}".\nScreen content:\n${screen.text}`);
    }
  },
});
