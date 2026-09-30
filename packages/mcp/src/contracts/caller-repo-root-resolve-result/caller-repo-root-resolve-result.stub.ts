/**
 * PURPOSE: Builds a valid CallerRepoRootResolveResult for tests
 *
 * USAGE:
 * CallerRepoRootResolveResultStub();
 * // Returns a valid CallerRepoRootResolveResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { CallerRepoRootSourceStub } from '../caller-repo-root-source/caller-repo-root-source.stub';

import { callerRepoRootResolveResultContract } from './caller-repo-root-resolve-result-contract';
import type { CallerRepoRootResolveResult } from './caller-repo-root-resolve-result-contract';

export const CallerRepoRootResolveResultStub = ({
  ...props
}: StubArgument<CallerRepoRootResolveResult> = {}): CallerRepoRootResolveResult =>
  callerRepoRootResolveResultContract.parse({
    repoRoot: 'sample',
    source: CallerRepoRootSourceStub({ value: 'caller-cwd' }),
    configFound: false,
    ...props,
  });
