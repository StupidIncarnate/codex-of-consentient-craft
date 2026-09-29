/**
 * PURPOSE: Reads ESLint's JSON report and keeps only the hits of the scanned rule, as repo-relative
 * ScanViolations in file-then-line order. Reach for this over `eslintJsonParseTransformer`, which
 * keeps every rule's errors and reports absolute paths.
 *
 * USAGE:
 * eslintJsonToScanViolationsTransformer({ jsonOutput: '[{"filePath":"/repo/a.ts","messages":[{"ruleId":"no-console","line":3,"message":"No."}]}]', rule: ScanRuleNameStub({ value: 'no-console' }), rootPath: AbsoluteFilePathStub({ value: '/repo' }) });
 * // Returns: [{ file: 'a.ts', line: 3, message: 'No.' }]
 */

import { errorMessageContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { eslintJsonReportContract } from '../../contracts/eslint-json-report/eslint-json-report-contract';
import type { ScanRuleName } from '../../contracts/scan-rule-name/scan-rule-name-contract';
import {
  scanViolationContract,
  type ScanViolation,
} from '../../contracts/scan-violation/scan-violation-contract';
import { extractJsonArrayTransformer } from '../extract-json-array/extract-json-array-transformer';

const PREVIEW_LENGTH = 300;

export const eslintJsonToScanViolationsTransformer = ({
  jsonOutput,
  rule,
  rootPath,
}: {
  jsonOutput: string;
  rule: ScanRuleName;
  rootPath: AbsoluteFilePath;
}): ScanViolation[] => {
  const slice = extractJsonArrayTransformer({ output: errorMessageContract.parse(jsonOutput) });

  const report = ((): ReturnType<typeof eslintJsonReportContract.parse> => {
    try {
      return eslintJsonReportContract.parse(JSON.parse(slice));
    } catch (error: unknown) {
      throw new Error(
        `ESLint output was not a JSON report: ${jsonOutput.slice(0, PREVIEW_LENGTH)}`,
        { cause: error },
      );
    }
  })();

  const rootPrefix = `${String(rootPath)}/`;

  return report
    .flatMap((entry) =>
      (entry.messages ?? [])
        .filter((message) => String(message.ruleId) === String(rule))
        .map((message) => {
          const absolute = String(entry.filePath);
          return scanViolationContract.parse({
            file: absolute.startsWith(rootPrefix) ? absolute.slice(rootPrefix.length) : absolute,
            line: message.line ?? 0,
            message: message.message ?? '',
          });
        }),
    )
    .sort((a, b) =>
      a.file === b.file ? a.line - b.line : String(a.file).localeCompare(String(b.file)),
    );
};
