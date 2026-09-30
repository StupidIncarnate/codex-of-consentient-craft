/**
 * PURPOSE: Builds a valid DiscoveryDiff for tests
 *
 * USAGE:
 * DiscoveryDiffStub();
 * // Returns a valid DiscoveryDiff
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { discoveryDiffContract } from './discovery-diff-contract';
import type { DiscoveryDiff } from './discovery-diff-contract';

export const DiscoveryDiffStub = ({ ...props }: StubArgument<DiscoveryDiff> = {}): DiscoveryDiff =>
  discoveryDiffContract.parse({ onlyDiscovered: [], onlyProcessed: [], ...props });
