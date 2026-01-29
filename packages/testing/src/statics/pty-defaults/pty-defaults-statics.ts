/**
 * PURPOSE: Default values for PTY terminal configuration
 *
 * USAGE:
 * import { ptyDefaultsStatics } from './pty-defaults-statics';
 * const cols = ptyDefaultsStatics.cols; // 80
 */

export const ptyDefaultsStatics = {
  /** Standard terminal column width (80 columns) */
  cols: 80,

  /** Standard terminal row height (24 rows) */
  rows: 24,

  /** Default terminal name for xterm with 256 color support */
  terminalName: 'xterm-256color',
} as const;
