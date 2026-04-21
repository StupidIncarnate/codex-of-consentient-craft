/**
 * PURPOSE: Parses Jest JSON output into an array of PassingTest values for passed tests only
 *
 * USAGE:
 * const passing = jestJsonParsePassingTransformer({ jsonOutput: '{"testResults":[...]}' });
 * // Returns PassingTest[] containing only passed assertionResults entries
 */

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

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
    const parsed: unknown = JSON.parse(jsonString);

    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }

    const testResults: unknown = Reflect.get(parsed, 'testResults');

    if (!Array.isArray(testResults)) {
      return [];
    }

    return testResults.flatMap((suite: unknown) => {
      if (typeof suite !== 'object' || suite === null) {
        return [];
      }

      const testFilePath: unknown = Reflect.get(suite, 'name');
      const suiteResults: unknown = Reflect.get(suite, 'assertionResults');

      if (typeof testFilePath !== 'string' || !Array.isArray(suiteResults)) {
        return [];
      }

      return suiteResults.reduce<PassingTest[]>((passing, test: unknown) => {
        if (typeof test !== 'object' || test === null) {
          return passing;
        }

        const status: unknown = Reflect.get(test, 'status');

        if (status !== 'passed') {
          return passing;
        }

        const fullName: unknown = Reflect.get(test, 'fullName');

        if (typeof fullName !== 'string') {
          return passing;
        }

        const duration: unknown = Reflect.get(test, 'duration');
        const durationMs = typeof duration === 'number' && duration >= 0 ? duration : 0;

        return [
          ...passing,
          passingTestContract.parse({
            suitePath: testFilePath,
            testName: fullName,
            durationMs,
          }),
        ];
      }, []);
    });
  } catch {
    return [];
  }
};
