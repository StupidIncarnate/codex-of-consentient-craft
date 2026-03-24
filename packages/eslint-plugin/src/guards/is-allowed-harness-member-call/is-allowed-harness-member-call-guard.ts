/**
 * PURPOSE: Checks if a member expression call (obj.method()) is allowed in a harness constructor
 *
 * USAGE:
 * isAllowedHarnessMemberCallGuard({ objectName: 'fs', propertyName: 'mkdirSync' });
 * // Returns true — fs is an allowed node builtin
 */
import { jestMockingStatics } from '../../statics/jest-mocking/jest-mocking-statics';
import { harnessLifecycleStatics } from '../../statics/harness-lifecycle/harness-lifecycle-statics';

export const isAllowedHarnessMemberCallGuard = ({
  objectName,
  propertyName,
}: {
  objectName?: string | undefined;
  propertyName?: string | undefined;
}): boolean => {
  if (propertyName !== undefined && jestMockingStatics.mockMethodSet.has(propertyName)) {
    return true;
  }

  const name = objectName ?? 'unknown';
  const isJestOperation = name === 'jest';
  const isChildHarness = name.endsWith('Harness');
  const isNodeBuiltin = harnessLifecycleStatics.allowedNodeBuiltinSet.has(name);

  return isJestOperation || isChildHarness || isNodeBuiltin;
};
