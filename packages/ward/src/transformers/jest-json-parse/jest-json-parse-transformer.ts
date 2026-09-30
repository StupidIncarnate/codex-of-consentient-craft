/**
 * PURPOSE: Parses Jest JSON output into an array of TestFailure values for failed tests only
 *
 * USAGE:
 * const failures = jestJsonParseTransformer({ jsonOutput: '{"testResults":[...]}' });
 * // Returns TestFailure[] containing only failed test entries
 */

import { jestJsonReportContract } from '../../contracts/jest-json-report/jest-json-report-contract';
import {
  testFailureContract,
  type TestFailure,
} from '../../contracts/test-failure/test-failure-contract';
import { extractJsonObjectTransformer } from '../extract-json-object/extract-json-object-transformer';
import { stripAnsiCodesTransformer } from '../strip-ansi-codes/strip-ansi-codes-transformer';
import { annotateTimeoutFailureTransformer } from '../annotate-timeout-failure/annotate-timeout-failure-transformer';
import { stripTimeoutNoiseTransformer } from '../strip-timeout-noise/strip-timeout-noise-transformer';

export const jestJsonParseTransformer = ({
  jsonOutput,
}: {
  jsonOutput: string;
}): TestFailure[] => {
  const jsonString = extractJsonObjectTransformer({ output: jsonOutput });
  const report = jestJsonReportContract.safeParse(JSON.parse(jsonString));

  if (!report.success) {
    return [];
  }

  const { testResults } = report.data;

  if (testResults === undefined) {
    return [];
  }

  return testResults.flatMap((suite) => {
    const testFilePath = suite.name;
    const suiteResults = suite.assertionResults;

    if (testFilePath === undefined || suiteResults === undefined) {
      return [];
    }

    const assertionFailures = suiteResults.reduce<TestFailure[]>((failures, test) => {
      const { status } = test;

      if (status !== 'failed') {
        return failures;
      }

      const { fullName } = test;
      const { failureMessages } = test;

      if (fullName === undefined || failureMessages === undefined) {
        return failures;
      }

      const rawMessages = failureMessages
        .map((msg) => String(msg))
        .filter((msg: string) => msg.length > 0);

      const timeoutAnnotation = annotateTimeoutFailureTransformer({
        failureMessages: rawMessages,
      });

      const message =
        timeoutAnnotation ??
        stripTimeoutNoiseTransformer({
          message: rawMessages.join('\n'),
        });
      const firstMessage = failureMessages.length > 0 ? String(failureMessages[0]) : '';
      const hasStack = firstMessage.length > 0 && firstMessage.includes('\n    at ');

      const stackOnly =
        hasStack && firstMessage.length > 0
          ? firstMessage.slice(firstMessage.indexOf('\n    at '))
          : undefined;

      return [
        ...failures,
        testFailureContract.parse({
          suitePath: String(testFilePath),
          testName: String(fullName),
          message,
          ...(stackOnly !== undefined && timeoutAnnotation === null
            ? { stackTrace: stackOnly }
            : {}),
        }),
      ];
    }, []);

    const suiteStatus = suite.status;
    const suiteMessage = suite.message;

    if (
      suiteStatus === 'failed' &&
      suiteMessage !== undefined &&
      String(suiteMessage).length > 0 &&
      assertionFailures.length === 0
    ) {
      const stripped = stripAnsiCodesTransformer({
        text: String(suiteMessage),
      });
      const cleanedMessage =
        stripped
          .split('\n')
          .map((line) => line.trim())
          .find((line) => line.length > 0 && !line.startsWith('●')) ?? stripped;

      const strippedSuiteMessage = stripTimeoutNoiseTransformer({
        message: cleanedMessage,
      });

      return [
        testFailureContract.parse({
          suitePath: String(testFilePath),
          testName: 'Test suite failed to run',
          message: strippedSuiteMessage,
        }),
      ];
    }

    return assertionFailures;
  });
};
