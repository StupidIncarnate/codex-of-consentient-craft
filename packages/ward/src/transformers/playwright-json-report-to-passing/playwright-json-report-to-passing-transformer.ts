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
import {
  playwrightJsonReportContract,
  type PlaywrightSuite,
} from '../../contracts/playwright-json-report/playwright-json-report-contract';

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
    const parsed = playwrightJsonReportContract.parse(JSON.parse(String(jsonContent)));

    const rootSuites = parsed.suites;
    if (rootSuites === undefined) {
      return [];
    }

    const passing: PassingTest[] = [];
    const stack = rootSuites.map((suite) => ({ suite, titlePrefix: '' }));

    while (stack.length > 0) {
      const frame = stack.shift();
      if (frame === undefined) {
        break;
      }
      const suite: PlaywrightSuite = frame.suite;
      const { titlePrefix } = frame;

      const { title } = suite;
      const nextPrefix =
        title !== undefined && String(title).length > 0
          ? titlePrefix.length > 0
            ? `${titlePrefix}${TITLE_SEPARATOR}${String(title)}`
            : String(title)
          : titlePrefix;

      const { specs } = suite;
      if (specs !== undefined) {
        for (const spec of specs) {
          const specTitle = spec.title;
          const { file } = spec;
          const { tests } = spec;
          if (specTitle === undefined || file === undefined || tests === undefined) {
            continue;
          }

          const fullTitle =
            nextPrefix.length > 0
              ? `${nextPrefix}${TITLE_SEPARATOR}${String(specTitle)}`
              : String(specTitle);

          for (const testNode of tests) {
            const { results } = testNode;
            if (results === undefined || results.length === 0) {
              continue;
            }
            const latestResult = results[results.length - 1];
            if (latestResult === undefined) {
              continue;
            }
            const { status } = latestResult;
            if (status !== 'passed') {
              continue;
            }
            const { duration } = latestResult;
            const durationMs =
              duration !== undefined && Number(duration) >= 0 ? Number(duration) : 0;

            passing.push(
              passingTestContract.parse({
                suitePath: String(file),
                testName: fullTitle,
                durationMs,
              }),
            );
          }
        }
      }

      const nestedSuites = suite.suites;
      if (nestedSuites !== undefined) {
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
