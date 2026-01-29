/**
 * PURPOSE: Configuration constants for CLI screen detection in E2E tests
 *
 * USAGE:
 * const tail = output.slice(-e2eScreenPatternsStatics.errorOutputTailLength);
 * for (const screen of e2eScreenPatternsStatics.screenPriority) { ... }
 */

export const e2eScreenPatternsStatics = {
  /** Number of characters to show in timeout error messages */
  errorOutputTailLength: 500,

  /** Order to check screens when detecting (more specific first) */
  screenPriority: ['answer', 'add', 'list', 'help', 'run', 'init', 'menu'],
} as const;
