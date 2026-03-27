/**
 * PURPOSE: Derives the expected test file path from a focus file path and test type configuration
 *
 * USAGE:
 * focusFileToTestPathTransformer({focusPath: 'src/brokers/auth/login/auth-login-broker.ts', testType: 'unit'});
 * // Returns 'src/brokers/auth/login/auth-login-broker.test.ts', or undefined if testType is 'none'
 */
import type { StepFileReferenceStub } from '@dungeonmaster/shared/contracts';
import type { folderConfigStatics } from '@dungeonmaster/shared/statics';

type StepFileReference = ReturnType<typeof StepFileReferenceStub>;
type TestType = (typeof folderConfigStatics)[keyof typeof folderConfigStatics]['testType'];

export const focusFileToTestPathTransformer = ({
  focusPath,
  testType,
}: {
  focusPath?: StepFileReference['path'];
  testType?: TestType;
}): StepFileReference['path'] | undefined => {
  if (!focusPath || !testType || testType === 'none') {
    return undefined;
  }

  const pathStr = String(focusPath);
  const base = pathStr.replace(/\.tsx?$/u, '');
  const ext = pathStr.endsWith('.tsx') ? '.tsx' : '.ts';

  if (testType === 'integration') {
    return `${base}.integration.test${ext}` as StepFileReference['path'];
  }
  return `${base}.test${ext}` as StepFileReference['path'];
};
