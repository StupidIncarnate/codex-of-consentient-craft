/**
 * PURPOSE: Terminal escape codes for simulating keypresses in E2E tests
 *
 * USAGE:
 * cliProcess.stdin.write(e2eKeyCodesStatics.enter);
 * // Sends enter keypress to CLI
 */

export const e2eKeyCodesStatics = {
  enter: '\r',
  escape: '\x1b',
  up: '\x1b[A',
  down: '\x1b[B',
  backspace: '\x7f',
  tab: '\t',
} as const;

export type E2EKeyName = keyof typeof e2eKeyCodesStatics;
