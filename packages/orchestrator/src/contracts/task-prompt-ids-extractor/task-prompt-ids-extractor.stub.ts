/**
 * PURPOSE: Builds a valid TaskPromptIdsExtractor for tests
 *
 * USAGE:
 * TaskPromptIdsExtractorStub();
 * // Returns a valid TaskPromptIdsExtractor
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { taskPromptIdsExtractorContract } from './task-prompt-ids-extractor-contract';
import type { TaskPromptIdsExtractor } from './task-prompt-ids-extractor-contract';

export const TaskPromptIdsExtractorStub = ({
  ...props
}: StubArgument<TaskPromptIdsExtractor> = {}): TaskPromptIdsExtractor =>
  taskPromptIdsExtractorContract.parse({
    questId: QuestStub().id,
    workItemId: WorkItemStub().id,
    ...props,
  });
