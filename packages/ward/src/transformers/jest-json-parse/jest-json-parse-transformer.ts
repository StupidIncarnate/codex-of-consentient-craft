/**
 * PURPOSE: Parses Jest JSON output into an array of TestFailure values for failed tests only
 *
 * USAGE:
 * const failures = jestJsonParseTransformer({ jsonOutput: '{"testResults":[...]}' });
 * // Returns TestFailure[] containing only failed test entries
 */

import {
  testFailureContract,
  type TestFailure,
} from '../../contracts/test-failure/test-failure-contract';

export const jestJsonParseTransformer = ({ jsonOutput }: { jsonOutput: string }): TestFailure[] => {
  const parsed: unknown = JSON.parse(jsonOutput);

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

    const testFilePath: unknown = Reflect.get(suite, 'testFilePath');
    const suiteResults: unknown = Reflect.get(suite, 'testResults');

    if (typeof testFilePath !== 'string' || !Array.isArray(suiteResults)) {
      return [];
    }

    return suiteResults.reduce<TestFailure[]>((failures, test: unknown) => {
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
  });
};
