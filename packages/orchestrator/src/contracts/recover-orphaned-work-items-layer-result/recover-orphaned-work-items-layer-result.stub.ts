/**
 * PURPOSE: Builds a valid RecoverOrphanedWorkItemsLayerResult for tests
 *
 * USAGE:
 * RecoverOrphanedWorkItemsLayerResultStub();
 * // Returns a valid RecoverOrphanedWorkItemsLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { recoverOrphanedWorkItemsLayerResultContract } from './recover-orphaned-work-items-layer-result-contract';
import type { RecoverOrphanedWorkItemsLayerResult } from './recover-orphaned-work-items-layer-result-contract';

export const RecoverOrphanedWorkItemsLayerResultStub = ({
  ...props
}: StubArgument<RecoverOrphanedWorkItemsLayerResult> = {}): RecoverOrphanedWorkItemsLayerResult =>
  recoverOrphanedWorkItemsLayerResultContract.parse({
    quest: QuestStub(),
    blocked: false,
    ...props,
  });
