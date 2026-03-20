/**
 * PURPOSE: Checks if a Playwright JSON suite entry is a project-level wrapper (e.g. "chromium") rather than a file-level suite
 *
 * USAGE:
 * isPlaywrightProjectSuiteGuard({suite: {title: 'chromium', suites: [{title: 'login.spec.ts'}], specs: []}});
 * // Returns true because the suite has no specs of its own and wraps nested file suites
 */

export const isPlaywrightProjectSuiteGuard = ({ suite }: { suite?: unknown }): boolean => {
  if (typeof suite !== 'object' || suite === null) {
    return false;
  }
  const specs: unknown = 'specs' in suite ? Reflect.get(suite, 'specs') : undefined;
  const nestedSuites: unknown = 'suites' in suite ? Reflect.get(suite, 'suites') : undefined;
  const hasNoSpecs = !Array.isArray(specs) || specs.length === 0;
  const hasNestedSuites = Array.isArray(nestedSuites) && nestedSuites.length > 0;
  return hasNoSpecs && hasNestedSuites;
};
