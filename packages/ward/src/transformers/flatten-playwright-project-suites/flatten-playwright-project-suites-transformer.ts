/**
 * PURPOSE: Flattens Playwright project-level suite wrappers (e.g. "chromium") to extract file-level suites
 *
 * USAGE:
 * flattenPlaywrightProjectSuitesTransformer({ suites: [{title: 'chromium', suites: [{title: 'login.spec.ts'}], specs: []}] });
 * // Returns [{title: 'login.spec.ts'}] - the file-level suites unwrapped from the project wrapper
 */

import { isPlaywrightProjectSuiteGuard } from '../../guards/is-playwright-project-suite/is-playwright-project-suite-guard';

export const flattenPlaywrightProjectSuitesTransformer = ({
  suites,
}: {
  suites: unknown[];
}): unknown[] => {
  const result: unknown[] = [];
  for (const suite of suites) {
    if (isPlaywrightProjectSuiteGuard({ suite })) {
      const nested: unknown = Reflect.get(suite as object, 'suites');
      if (Array.isArray(nested)) {
        for (const item of nested) {
          result.push(item);
        }
      }
    } else {
      result.push(suite);
    }
  }
  return result;
};
