/**
 * PURPOSE: Names the Playwright `page`/`locator` methods whose FIRST argument is a function that runs
 * inside the driven browser, not in the calling Node process. platform-globals-ban reads this to
 * leave a DOM global alone inside such a function, since the gateway cannot reach that process.
 *
 * USAGE:
 * pageCallbackMethodsStatics.names.includes('evaluate');
 * // Returns true
 */
export const pageCallbackMethodsStatics = {
  names: ['evaluate', 'evaluateAll', 'waitForFunction', 'addInitScript'],
} as const;
