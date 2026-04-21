/**
 * PURPOSE: Parses a Playwright JSON report into an array of PassingTest values for passed specs only
 *
 * USAGE:
 * const passing = playwrightJsonReportToPassingTransformer({ jsonContent: '{"suites":[...]}' });
 * // Returns PassingTest[] containing passed test specs with suitePath, testName, durationMs
 */

import type { FileContents } from '@dungeonmaster/shared/contracts';

import {
  passingTestContract,
  type PassingTest,
} from '../../contracts/passing-test/passing-test-contract';

const TITLE_SEPARATOR = ' › ';

export const playwrightJsonReportToPassingTransformer = ({
  jsonContent,
}: {
  jsonContent: FileContents;
}): PassingTest[] => {
  if (String(jsonContent).length === 0) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(String(jsonContent));

    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }

    const rootSuites: unknown = Reflect.get(parsed, 'suites');
    if (!Array.isArray(rootSuites)) {
      return [];
    }

    const passing: PassingTest[] = [];
    const stack = rootSuites.map((suite: unknown) => ({ suite, titlePrefix: '' }));

    while (stack.length > 0) {
      const frame = stack.shift();
      if (frame === undefined) {
        break;
      }
      const { suite, titlePrefix } = frame;
      if (typeof suite !== 'object' || suite === null) {
        continue;
      }

      const title: unknown = Reflect.get(suite, 'title');
      const nextPrefix =
        typeof title === 'string' && title.length > 0
          ? titlePrefix.length > 0
            ? `${titlePrefix}${TITLE_SEPARATOR}${title}`
            : title
          : titlePrefix;

      const specs: unknown = Reflect.get(suite, 'specs');
      if (Array.isArray(specs)) {
        for (const spec of specs) {
          if (typeof spec !== 'object' || spec === null) {
            continue;
          }
          const specTitle: unknown = Reflect.get(spec, 'title');
          const file: unknown = Reflect.get(spec, 'file');
          const tests: unknown = Reflect.get(spec, 'tests');
          if (typeof specTitle !== 'string' || typeof file !== 'string' || !Array.isArray(tests)) {
            continue;
          }

          const fullTitle =
            nextPrefix.length > 0 ? `${nextPrefix}${TITLE_SEPARATOR}${specTitle}` : specTitle;

          for (const testNode of tests) {
            if (typeof testNode !== 'object' || testNode === null) {
              continue;
            }
            const results: unknown = Reflect.get(testNode, 'results');
            if (!Array.isArray(results) || results.length === 0) {
              continue;
            }
            const latestResult: unknown = results[results.length - 1];
            if (typeof latestResult !== 'object' || latestResult === null) {
              continue;
            }
            const status: unknown = Reflect.get(latestResult, 'status');
            if (status !== 'passed') {
              continue;
            }
            const duration: unknown = Reflect.get(latestResult, 'duration');
            const durationMs = typeof duration === 'number' && duration >= 0 ? duration : 0;

            passing.push(
              passingTestContract.parse({
                suitePath: file,
                testName: fullTitle,
                durationMs,
              }),
            );
          }
        }
      }

      const nestedSuites: unknown = Reflect.get(suite, 'suites');
      if (Array.isArray(nestedSuites)) {
        for (const nested of nestedSuites) {
          stack.push({ suite: nested, titlePrefix: nextPrefix });
        }
      }
    }

    return passing;
  } catch {
    return [];
  }
};
