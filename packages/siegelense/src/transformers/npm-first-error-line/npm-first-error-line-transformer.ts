/**
 * PURPOSE: Picks the one line of a failed npm command's combined output worth printing in a
 * one-line install report — npm prints a dozen lines per failure, and an init summary line that
 * carries all of them buries the cause. A bare `npm error code E404` names the class but not the
 * package, so any other error line — a later npm one, or the tsc line under `npm run build` — wins
 * over it.
 *
 * USAGE:
 * npmFirstErrorLineTransformer({ output: 'npm error code E404\nnpm error 404 Not Found - GET https://…' });
 * // Returns 'npm error 404 Not Found - GET https://…'
 */

const NPM_ERROR_LINE = /^npm (?:error|ERR!) /u;
const NPM_ERROR_CODE_LINE = /^npm (?:error|ERR!) code \S+$/u;
const ANY_ERROR_LINE = /error/iu;
const NO_OUTPUT = '(npm printed no output)';

export const npmFirstErrorLineTransformer = ({ output }: { output: string }): string => {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const npmErrorLines = lines.filter((line) => NPM_ERROR_LINE.test(line));
  const npmErrorBody = npmErrorLines.find((line) => !NPM_ERROR_CODE_LINE.test(line));

  return (
    npmErrorBody ??
    lines.find((line) => ANY_ERROR_LINE.test(line) && !NPM_ERROR_CODE_LINE.test(line)) ??
    npmErrorLines[0] ??
    lines[0] ??
    NO_OUTPUT
  );
};
