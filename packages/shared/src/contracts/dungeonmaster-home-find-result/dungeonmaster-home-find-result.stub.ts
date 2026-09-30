/**
 * PURPOSE: Builds a valid DungeonmasterHomeFindResult for tests
 *
 * USAGE:
 * DungeonmasterHomeFindResultStub();
 * // Returns a valid DungeonmasterHomeFindResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { dungeonmasterHomeFindResultContract } from './dungeonmaster-home-find-result-contract';
import type { DungeonmasterHomeFindResult } from './dungeonmaster-home-find-result-contract';

export const DungeonmasterHomeFindResultStub = ({
  ...props
}: StubArgument<DungeonmasterHomeFindResult> = {}): DungeonmasterHomeFindResult =>
  dungeonmasterHomeFindResultContract.parse({ homePath: 'sample', ...props });
