/**
 * PURPOSE: Create stub TsconfigPathsLocateResult instances for testing
 *
 * USAGE:
 * const result = TsconfigPathsLocateResultStub({ situation: 'missingPaths' });
 * // Returns valid TsconfigPathsLocateResult instance
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import {
  tsconfigPathsLocateResultContract,
  type TsconfigPathsLocateResult,
} from './tsconfig-paths-locate-result-contract';

// One complete, minimal-but-valid default PER MEMBER, mirroring the discriminated-union stub
// pattern in siegelense's boot-poll-outcome.stub.ts.
const TSCONFIG_PATHS_LOCATE_RESULT_DEFAULTS = {
  missingCompilerOptions: { situation: 'missingCompilerOptions' },
  missingPaths: {
    situation: 'missingPaths',
    insertPos: 24,
    indent: '    ',
    needsLeadingComma: true,
  },
  hasPaths: {
    situation: 'hasPaths',
    insertPos: 100,
    indent: '      ',
    needsLeadingComma: false,
    existingKeys: [],
  },
} as const satisfies Record<TsconfigPathsLocateResult['situation'], Record<string, unknown>>;

export const TsconfigPathsLocateResultStub = ({
  ...props
}: StubArgument<TsconfigPathsLocateResult> = {}): TsconfigPathsLocateResult => {
  // `StubArgument` unbrands every literal, so `props.situation` reads as plain `string` here — a
  // chained comparison (rather than an object index) is what resolves the right default without an
  // `any`-typed lookup, mirroring boot-poll-outcome.stub.ts's own discriminated-union stub.
  const situation = props.situation ?? 'hasPaths';
  const base =
    situation === 'missingPaths'
      ? TSCONFIG_PATHS_LOCATE_RESULT_DEFAULTS.missingPaths
      : situation === 'missingCompilerOptions'
        ? TSCONFIG_PATHS_LOCATE_RESULT_DEFAULTS.missingCompilerOptions
        : TSCONFIG_PATHS_LOCATE_RESULT_DEFAULTS.hasPaths;

  return tsconfigPathsLocateResultContract.parse({ ...base, ...props });
};
