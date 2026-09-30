/**
 * PURPOSE: Builds a valid GlobDiscoverFilesResult for tests
 *
 * USAGE:
 * GlobDiscoverFilesResultStub();
 * // Returns a valid GlobDiscoverFilesResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { ProjectResultStub } from '../project-result/project-result.stub';

import { globDiscoverFilesResultContract } from './glob-discover-files-result-contract';
import type { GlobDiscoverFilesResult } from './glob-discover-files-result-contract';

export const GlobDiscoverFilesResultStub = ({
  ...props
}: StubArgument<GlobDiscoverFilesResult> = {}): GlobDiscoverFilesResult =>
  globDiscoverFilesResultContract.parse({
    discoveredCount: ProjectResultStub().discoveredCount,
    discoveredFiles: [],
    ...props,
  });
