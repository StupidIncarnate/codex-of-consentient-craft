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
import { eslintJsonReportContract } from '../../contracts/eslint-json-report/eslint-json-report-contract';
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
  const rawJson: unknown = JSON.parse(cleanedOutput);
  const parsedReport = ((): ReturnType<typeof eslintJsonReportContract.parse> | null => {
    try {
      return eslintJsonReportContract.parse(rawJson);
    } catch {
      return null;
    }
  })();

  if (parsedReport === null) {
    return [];
  }

  return parsedReport.flatMap((entryParsed) => {
    const { filePath } = entryParsed;
    const { messages } = entryParsed;

    if (filePath === undefined || messages === undefined) {
      return [];
    }

    return messages.reduce<ErrorEntry[]>((entries, message) => {
      const { ruleId } = message;
      const { severity } = message;
      const msg = message.message;
      const { line } = message;
      const { column } = message;

      if (severity === undefined || msg === undefined) {
        return entries;
      }

      const resolvedLine = line ?? 0;
      const resolvedColumn = column ?? 0;

      const severityKey = Number(severity) as keyof typeof eslintSeverityStatics;
      const severityValue = eslintSeverityStatics[severityKey];

      return [
        ...entries,
        errorEntryContract.parse({
          filePath: String(filePath),
          line: Number(resolvedLine),
          column: Number(resolvedColumn),
          message: String(msg),
          severity: severityValue,
          ...(typeof ruleId === 'string' && ruleId.length > 0 ? { rule: String(ruleId) } : {}),
        }),
      ];
    }, []);
  });
};
