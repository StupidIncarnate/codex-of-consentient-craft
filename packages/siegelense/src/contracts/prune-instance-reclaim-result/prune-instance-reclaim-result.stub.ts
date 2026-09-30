/**
 * PURPOSE: Builds a valid PruneInstanceReclaimResult for tests
 *
 * USAGE:
 * PruneInstanceReclaimResultStub();
 * // Returns a valid PruneInstanceReclaimResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { PruneRemovalStub } from '../prune-removal/prune-removal.stub';
import { PruneRefusalStub } from '../prune-refusal/prune-refusal.stub';

import { pruneInstanceReclaimResultContract } from './prune-instance-reclaim-result-contract';
import type { PruneInstanceReclaimResult } from './prune-instance-reclaim-result-contract';

export const PruneInstanceReclaimResultStub = ({
  ...props
}: StubArgument<PruneInstanceReclaimResult> = {}): PruneInstanceReclaimResult =>
  pruneInstanceReclaimResultContract.parse({
    removal: PruneRemovalStub(),
    refusal: PruneRefusalStub(),
    gaps: [],
    ...props,
  });
