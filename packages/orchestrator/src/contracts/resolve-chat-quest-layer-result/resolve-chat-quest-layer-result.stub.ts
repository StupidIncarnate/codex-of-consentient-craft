/**
 * PURPOSE: Builds a valid ResolveChatQuestLayerResult for tests
 *
 * USAGE:
 * ResolveChatQuestLayerResultStub();
 * // Returns a valid ResolveChatQuestLayerResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { resolveChatQuestLayerResultContract } from './resolve-chat-quest-layer-result-contract';
import type { ResolveChatQuestLayerResult } from './resolve-chat-quest-layer-result-contract';

export const ResolveChatQuestLayerResultStub = ({
  ...props
}: StubArgument<ResolveChatQuestLayerResult> = {}): ResolveChatQuestLayerResult =>
  resolveChatQuestLayerResultContract.parse({
    questId: QuestStub().id,
    workItemId: WorkItemStub().id,
    createdQuest: false,
    ...props,
  });
