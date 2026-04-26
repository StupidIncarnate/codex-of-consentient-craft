/**
 * PURPOSE: Parses Jest JSON output into an array of PassingTest values for passed tests only
 *
 * USAGE:
 * const passing = jestJsonParsePassingTransformer({ jsonOutput: '{"testResults":[...]}' });
 * // Returns PassingTest[] containing only passed assertionResults entries
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { jestJsonReportContract } from '../../contracts/jest-json-report/jest-json-report-contract';
import {
  passingTestContract,
  type PassingTest,
} from '../../contracts/passing-test/passing-test-contract';
import { extractJsonObjectTransformer } from '../extract-json-object/extract-json-object-transformer';

export const jestJsonParsePassingTransformer = ({
  jsonOutput,
}: {
  jsonOutput: ErrorMessage;
}): PassingTest[] => {
  try {
    const jsonString = extractJsonObjectTransformer({ output: jsonOutput });
    const parsed = jestJsonReportContract.parse(JSON.parse(jsonString));

    const { testResults } = parsed;

    if (testResults === undefined) {
      return [];
    }

    return testResults.flatMap((suite) => {
      const testFilePath = suite.name;
      const suiteResults = suite.assertionResults;

      if (testFilePath === undefined || suiteResults === undefined) {
        return [];
      }

      return suiteResults.reduce<PassingTest[]>((passing, test) => {
        const { status } = test;

        if (status !== 'passed') {
          return passing;
        }

        const { fullName } = test;

        if (fullName === undefined) {
          return passing;
        }

        const { duration } = test;
        const durationMs =
          duration !== null && duration !== undefined && Number(duration) >= 0
            ? Number(duration)
            : 0;

        return [
          ...passing,
          passingTestContract.parse({
            suitePath: String(testFilePath),
            testName: String(fullName),
            durationMs,
          }),
        ];
      }, []);
    });
  } catch {
    return [];
  }
};
