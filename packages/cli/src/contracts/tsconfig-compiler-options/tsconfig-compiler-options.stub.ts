/**
 * PURPOSE: Create stub TsconfigCompilerOptions instances for testing
 *
 * USAGE:
 * const options = TsconfigCompilerOptionsStub({ module: 'node16' });
 * // Returns valid TsconfigCompilerOptions instance
 */

import {
  tsconfigCompilerOptionsContract,
  type TsconfigCompilerOptions,
} from './tsconfig-compiler-options-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const TsconfigCompilerOptionsStub = ({
  ...props
}: StubArgument<TsconfigCompilerOptions> = {}): TsconfigCompilerOptions =>
  tsconfigCompilerOptionsContract.parse({
    customConditions: ['source'],
    ...props,
  });
