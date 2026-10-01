/**
 * PURPOSE: Turns text a command wrote for a terminal into text a browser row can show. Ward
 * redraws its progress lines in place (`running...\r`, then `\x1b[K<result>`), and that only
 * works in a terminal: through a pipe every byte survives, and the UI shows `[K` junk, empty rows
 * and two progress lines glued together. Reach for this on every command output that is headed
 * for the UI. The raw text stays on disk, because a repair session reads it as it was printed.
 *
 * USAGE:
 * terminalTextCleanTransformer({ text: 'lint  a  running...\r\x1b[Klint  a  PASS\n\r\x1b[K\n' });
 * // Returns 'lint  a  running...\nlint  a  PASS'
 */

// Strings, not regex escapes: `no-control-regex` refuses a control character in a regex literal.
const ESC = '\u001b';
const BEL = '\u0007';
// CSI (`ESC [ … final`), OSC (`ESC ] … BEL` or `ESC ] … ESC \`), and the two-byte `ESC <char>` forms.
const ESCAPE_SEQUENCE_PATTERN = new RegExp(
  `${ESC}(?:\\[[0-?]*[ -/]*[@-~]|\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)|[@-Z\\\\-_])`,
  'gu',
);
// A bare `\r` is a line break here: the text before it is a progress line the terminal would have
// overwritten, and keeping it as its own row reads better than dropping it.
const LINE_BREAK_PATTERN = /\r\n|\r|\n/u;

export const terminalTextCleanTransformer = ({ text }: { text: string }): string =>
  text
    .replace(ESCAPE_SEQUENCE_PATTERN, '')
    .split(LINE_BREAK_PATTERN)
    .filter((line) => line.trim() !== '')
    .join('\n');
