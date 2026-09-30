/**
 * PURPOSE: Create stub TestGuildPackageJson instances for testing
 *
 * USAGE:
 * const packageJson = TestGuildPackageJsonStub({name: 'my-test-project'});
 * // Returns valid TestGuildPackageJson instance
 */

import {
  testGuildPackageJsonContract,
  type TestGuildPackageJson,
} from './test-guild-package-json-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TestGuildPackageJsonStub = ({
  ...props
}: StubArgument<TestGuildPackageJson> = {}): TestGuildPackageJson =>
  testGuildPackageJsonContract.parse({
    name: 'test-project',
    version: '1.0.0',
    scripts: {
      test: 'jest',
      lint: 'eslint',
      typecheck: 'tsc --noEmit',
    },
    ...props,
  });
