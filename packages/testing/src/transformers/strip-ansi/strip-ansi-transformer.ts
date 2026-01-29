/**
 * PURPOSE: Strips ANSI escape codes from terminal output
 *
 * USAGE:
 * const cleanFrame = stripAnsiTransformer({ frame: '\x1b[?25lHello\x1b[0m' });
 * // Returns 'Hello' as ScreenFrame with all ANSI codes removed
 */

import { screenFrameContract } from '../../contracts/screen-frame/screen-frame-contract';
import type { ScreenFrame } from '../../contracts/screen-frame/screen-frame-contract';

// ANSI escape code pattern - matches all common ANSI sequences:
// - CSI sequences: ESC [ ... (parameters) final byte
// - OSC sequences: ESC ] ... ST (operating system commands)
// - Simple sequences: ESC followed by single char
// This regex covers cursor movement, colors, and terminal control codes like [?25l (hide cursor)
// Using RegExp constructor to avoid control character lint errors
const ANSI_PATTERN = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d/#&.:=?%@~_]*)*)?' +
    '\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  'gu',
);

export const stripAnsiTransformer = ({ frame }: { frame: ScreenFrame }): ScreenFrame => {
  const stripped = frame.replace(ANSI_PATTERN, '');
  return screenFrameContract.parse(stripped);
};
