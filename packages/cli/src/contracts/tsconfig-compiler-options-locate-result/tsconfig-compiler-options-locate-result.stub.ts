/**
 * PURPOSE: Create stub TsconfigCompilerOptionsLocateResult instances for testing
 *
 * USAGE:
 * const located = TsconfigCompilerOptionsLocateResultStub({ situation: 'missingCompilerOptions' });
 * // Returns valid TsconfigCompilerOptionsLocateResult instance
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  tsconfigCompilerOptionsLocateResultContract,
  type TsconfigCompilerOptionsLocateResult,
} from './tsconfig-compiler-options-locate-result-contract';

export const TsconfigCompilerOptionsLocateResultStub = ({
  ...props
}: StubArgument<TsconfigCompilerOptionsLocateResult> = {}): TsconfigCompilerOptionsLocateResult =>
  tsconfigCompilerOptionsLocateResultContract.parse(
    props.situation === 'missingCompilerOptions'
      ? { situation: 'missingCompilerOptions' }
      : {
          situation: 'hasCompilerOptions',
          insertPos: 40,
          indent: '    ',
          needsLeadingComma: true,
          existing: [],
          ...props,
        },
  );
