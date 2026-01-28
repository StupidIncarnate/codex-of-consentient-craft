/**
 * PURPOSE: Defines terminal escape codes for keyboard input handling in debug mode
 *
 * USAGE:
 * debugKeysStatics.codes.enter;
 * // Returns '\r' escape code for Enter key
 */
export const debugKeysStatics = {
  codes: {
    enter: '\r',
    escape: '\x1B',
    up: '\x1B[A',
    down: '\x1B[B',
    backspace: '\x7F',
    tab: '\t',
  },
} as const;
