/**
 * PURPOSE: Parses TypeScript compiler text output into an array of ErrorEntry values
 *
 * USAGE:
 * const errors = tscOutputParseTransformer({ output: 'src/file.ts(10,5): error TS2345: Argument mismatch.' });
 * // Returns ErrorEntry[] parsed from TSC text output
 */

import {
  errorEntryContract,
  type ErrorEntry,
} from '../../contracts/error-entry/error-entry-contract';

const TSC_LINE_REGEX = /^(.+)\((\d+),(\d+)\): (error|warning) (TS\d+): (.+)$/u;

export const tscOutputParseTransformer = ({ output }: { output: string }): ErrorEntry[] =>
  output
    .trim()
    .split('\n')
    .filter((line) => line.length > 0)
    .reduce<ErrorEntry[]>((entries, line) => {
      const match = TSC_LINE_REGEX.exec(line);

      if (match === null) {
        return entries;
      }

      const [, filePath, lineStr, colStr, severity, tsCode, message] = match;

      return [
        ...entries,
        errorEntryContract.parse({
          filePath,
          line: Number(lineStr),
          column: Number(colStr),
          message: `${tsCode}: ${message}`,
          severity,
        }),
      ];
    }, []);
