/**
 * PURPOSE: Recursively walks a Playwright suite object and extracts failed test results as TestFailure values
 *
 * USAGE:
 * const failures = playwrightSuiteWalkTransformer({ suite: parsedSuite, parentPath: '' });
 * // Returns TestFailure[] from recursive suite traversal
 */

import {
  testFailureContract,
  type TestFailure,
} from '../../contracts/test-failure/test-failure-contract';

export const playwrightSuiteWalkTransformer = ({
  suite,
  parentPath,
}: {
  suite: unknown;
  parentPath: string;
}): TestFailure[] => {
  if (typeof suite !== 'object' || suite === null) {
    return [];
  }

  const title: unknown = Reflect.get(suite, 'title');

  if (typeof title !== 'string') {
    return [];
  }

  const currentPath = parentPath.length > 0 ? `${parentPath} > ${title}` : title;

  const specs: unknown = Reflect.get(suite, 'specs');
  const childSuites: unknown = Reflect.get(suite, 'suites');

  const specFailures: TestFailure[] = Array.isArray(specs)
    ? specs.flatMap((spec: unknown) => {
        if (typeof spec !== 'object' || spec === null) {
          return [];
        }

        const specTitle: unknown = Reflect.get(spec, 'title');
        const tests: unknown = Reflect.get(spec, 'tests');

        if (typeof specTitle !== 'string' || !Array.isArray(tests)) {
          return [];
        }

        return tests.flatMap((test: unknown) => {
          if (typeof test !== 'object' || test === null) {
            return [];
          }

          const results: unknown = Reflect.get(test, 'results');

          if (!Array.isArray(results)) {
            return [];
          }

          return results.reduce<TestFailure[]>((failures, result: unknown) => {
            if (typeof result !== 'object' || result === null) {
              return failures;
            }

            const status: unknown = Reflect.get(result, 'status');

            if (status !== 'failed') {
              return failures;
            }

            const error: unknown = Reflect.get(result, 'error');
            const errorMessage: unknown =
              typeof error === 'object' && error !== null ? Reflect.get(error, 'message') : null;
            const errorStack: unknown =
              typeof error === 'object' && error !== null ? Reflect.get(error, 'stack') : null;

            return [
              ...failures,
              testFailureContract.parse({
                suitePath: currentPath,
                testName: specTitle,
                message: typeof errorMessage === 'string' ? errorMessage : 'Unknown failure',
                ...(typeof errorStack === 'string' ? { stackTrace: errorStack } : {}),
              }),
            ];
          }, []);
        });
      })
    : [];

  const childFailures: TestFailure[] = Array.isArray(childSuites)
    ? childSuites.flatMap((childSuite: unknown) =>
        playwrightSuiteWalkTransformer({ suite: childSuite, parentPath: currentPath }),
      )
    : [];

  return [...specFailures, ...childFailures];
};
