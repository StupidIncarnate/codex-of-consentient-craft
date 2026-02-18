/**
 * PURPOSE: Parses ESLint JSON output into an array of ErrorEntry values
 *
 * USAGE:
 * const errors = eslintJsonParseTransformer({ jsonOutput: '[{"filePath":"/path/file.ts","messages":[...]}]' });
 * // Returns ErrorEntry[] with severity mapped from ESLint numeric codes
 */

import { errorMessageContract } from '@dungeonmaster/shared/contracts';

import {
  errorEntryContract,
  type ErrorEntry,
} from '../../contracts/error-entry/error-entry-contract';
import { eslintSeverityStatics } from '../../statics/eslint-severity/eslint-severity-statics';
import { extractJsonArrayTransformer } from '../extract-json-array/extract-json-array-transformer';

export const eslintJsonParseTransformer = ({
  jsonOutput,
}: {
  jsonOutput: string;
}): ErrorEntry[] => {
  const cleanedOutput = extractJsonArrayTransformer({
    output: errorMessageContract.parse(jsonOutput),
  });
  const parsed: unknown = JSON.parse(cleanedOutput);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((fileResult: unknown) => {
    if (typeof fileResult !== 'object' || fileResult === null) {
      return [];
    }

    const filePath: unknown = Reflect.get(fileResult, 'filePath');
    const messages: unknown = Reflect.get(fileResult, 'messages');

    if (typeof filePath !== 'string' || !Array.isArray(messages)) {
      return [];
    }

    return messages.reduce<ErrorEntry[]>((entries, message: unknown) => {
      if (typeof message !== 'object' || message === null) {
        return entries;
      }

      const ruleId: unknown = Reflect.get(message, 'ruleId');
      const severity: unknown = Reflect.get(message, 'severity');
      const msg: unknown = Reflect.get(message, 'message');
      const line: unknown = Reflect.get(message, 'line');
      const column: unknown = Reflect.get(message, 'column');

      if (
        typeof severity !== 'number' ||
        typeof msg !== 'string' ||
        typeof line !== 'number' ||
        typeof column !== 'number'
      ) {
        return entries;
      }

      const severityKey = severity as keyof typeof eslintSeverityStatics;
      const severityValue = eslintSeverityStatics[severityKey];

      return [
        ...entries,
        errorEntryContract.parse({
          filePath,
          line,
          column,
          message: msg,
          severity: severityValue,
          ...(typeof ruleId === 'string' ? { rule: ruleId } : {}),
        }),
      ];
    }, []);
  });
};
