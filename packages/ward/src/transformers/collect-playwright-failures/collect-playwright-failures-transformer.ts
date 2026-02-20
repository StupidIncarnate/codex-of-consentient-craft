/**
 * PURPOSE: Recursively traverses Playwright JSON suites to extract failed test specs as TestFailure values
 *
 * USAGE:
 * const failures = collectPlaywrightFailuresTransformer({ suites: parsedSuites, titlePath: [] });
 * // Returns TestFailure[] from nested Playwright suite structure
 */

import {
  testFailureContract,
  type TestFailure,
} from '../../contracts/test-failure/test-failure-contract';

export const collectPlaywrightFailuresTransformer = ({
  suites,
  titlePath,
}: {
  suites: unknown[];
  titlePath: string[];
}): TestFailure[] =>
  suites.flatMap((suite: unknown) => {
    if (typeof suite !== 'object' || suite === null) {
      return [];
    }

    const suiteTitle: unknown = Reflect.get(suite, 'title');
    const currentPath =
      typeof suiteTitle === 'string' && suiteTitle.length > 0
        ? [...titlePath, suiteTitle]
        : titlePath;

    const nestedSuites: unknown = Reflect.get(suite, 'suites');
    const specs: unknown = Reflect.get(suite, 'specs');

    const nestedFailures = Array.isArray(nestedSuites)
      ? collectPlaywrightFailuresTransformer({ suites: nestedSuites, titlePath: currentPath })
      : [];

    const specFailures = Array.isArray(specs)
      ? specs.flatMap((spec: unknown) => {
          if (typeof spec !== 'object' || spec === null) {
            return [];
          }

          const specTitle: unknown = Reflect.get(spec, 'title');
          const tests: unknown = Reflect.get(spec, 'tests');
          const file: unknown = Reflect.get(spec, 'file');

          if (typeof specTitle !== 'string' || !Array.isArray(tests)) {
            return [];
          }

          const suitePath = typeof file === 'string' ? file : (currentPath[0] ?? 'unknown');

          return tests.flatMap((test: unknown) => {
            if (typeof test !== 'object' || test === null) {
              return [];
            }

            const status: unknown = Reflect.get(test, 'status');

            if (status === 'expected' || status === 'skipped') {
              return [];
            }

            const results: unknown = Reflect.get(test, 'results');

            if (!Array.isArray(results) || results.length === 0) {
              return [];
            }

            const lastResult: unknown = results[results.length - 1];

            if (typeof lastResult !== 'object' || lastResult === null) {
              return [];
            }

            const error: unknown = Reflect.get(lastResult, 'error');
            const errorObj = typeof error === 'object' && error !== null ? error : null;

            const rawMessage: unknown = errorObj === null ? null : Reflect.get(errorObj, 'message');
            const rawStack: unknown = errorObj === null ? null : Reflect.get(errorObj, 'stack');

            const message =
              typeof rawMessage === 'string' && rawMessage.length > 0 ? rawMessage : 'Test failed';

            const stackTrace =
              typeof rawStack === 'string' && rawStack.length > 0 ? rawStack : undefined;

            const testTitle = [...currentPath, specTitle].join(' > ');

            return [
              testFailureContract.parse({
                suitePath,
                testName: testTitle,
                message,
                ...(stackTrace === undefined ? {} : { stackTrace }),
              }),
            ];
          });
        })
      : [];

    return [...nestedFailures, ...specFailures];
  });
