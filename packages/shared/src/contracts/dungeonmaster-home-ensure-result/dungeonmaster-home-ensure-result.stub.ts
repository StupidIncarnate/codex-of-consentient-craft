/**
 * PURPOSE: Builds a valid DungeonmasterHomeEnsureResult for tests
 *
 * USAGE:
 * DungeonmasterHomeEnsureResultStub();
 * // Returns a valid DungeonmasterHomeEnsureResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dungeonmasterHomeEnsureResultContract } from './dungeonmaster-home-ensure-result-contract';
import type { DungeonmasterHomeEnsureResult } from './dungeonmaster-home-ensure-result-contract';

export const DungeonmasterHomeEnsureResultStub = ({
  ...props
}: StubArgument<DungeonmasterHomeEnsureResult> = {}): DungeonmasterHomeEnsureResult =>
  dungeonmasterHomeEnsureResultContract.parse({
    homePath: 'sample',
    guildsPath: 'sample',
    ...props,
  });
