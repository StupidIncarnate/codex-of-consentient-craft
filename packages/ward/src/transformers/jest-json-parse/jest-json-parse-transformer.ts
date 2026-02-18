/**
 * PURPOSE: Parses Jest JSON output into an array of TestFailure values for failed tests only
 *
 * USAGE:
 * const failures = jestJsonParseTransformer({ jsonOutput: '{"testResults":[...]}' });
 * // Returns TestFailure[] containing only failed test entries
 */

import { type ErrorMessage, errorMessageContract } from '@dungeonmaster/shared/contracts';
import {
  testFailureContract,
  type TestFailure,
} from '../../contracts/test-failure/test-failure-contract';
import { extractJsonObjectTransformer } from '../extract-json-object/extract-json-object-transformer';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';

export const jestJsonParseTransformer = ({
  jsonOutput,
}: {
  jsonOutput: ErrorMessage;
}): TestFailure[] => {
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

    const assertionFailures = suiteResults.reduce<TestFailure[]>((failures, test: unknown) => {
      if (typeof test !== 'object' || test === null) {
        return failures;
      }

      const status: unknown = Reflect.get(test, 'status');

      if (status !== 'failed') {
        return failures;
      }

      const fullName: unknown = Reflect.get(test, 'fullName');
      const failureMessages: unknown = Reflect.get(test, 'failureMessages');

      if (typeof fullName !== 'string' || !Array.isArray(failureMessages)) {
        return failures;
      }

      const message = failureMessages
        .map((msg: unknown) => (typeof msg === 'string' ? msg : ''))
        .join('\n');
      const firstMessage: unknown = failureMessages.length > 0 ? failureMessages[0] : null;
      const hasStack = typeof firstMessage === 'string' && firstMessage.includes('\n    at ');

      return [
        ...failures,
        testFailureContract.parse({
          suitePath: testFilePath,
          testName: fullName,
          message,
          ...(hasStack ? { stackTrace: firstMessage } : {}),
        }),
      ];
    }, []);

    const suiteStatus: unknown = Reflect.get(suite, 'status');
    const suiteMessage: unknown = Reflect.get(suite, 'message');

    if (
      suiteStatus === 'failed' &&
      typeof suiteMessage === 'string' &&
      suiteMessage.length > 0 &&
      assertionFailures.length === 0
    ) {
      const stripped = stripAnsiCodesTransformer({
        text: errorMessageContract.parse(suiteMessage),
      });
      const cleanedMessage =
        stripped
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line.length > 0 && !line.startsWith('●')) ?? stripped;

      return [
        testFailureContract.parse({
          suitePath: testFilePath,
          testName: 'Test suite failed to run',
          message: cleanedMessage,
        }),
      ];
    }

    return assertionFailures;
  });
};
