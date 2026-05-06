/**
 * PURPOSE: Stub factory for orchestration callback parameter objects
 *
 * USAGE:
 * const params = OrchestrationCallbacksParamsStub();
 * // Returns valid parsed params for all three callback types
 */

import type { StubArgument } from '@dungeonmaster/shared/@types';
import { AssistantTextChatEntryStub } from '@dungeonmaster/shared/contracts';
import type { z } from 'zod';

import { orchestrationCallbacksContract } from './orchestration-callbacks-contract';

type ParamsShape = z.infer<typeof orchestrationCallbacksContract>;

export const OrchestrationCallbacksParamsStub = ({
  ...props
}: StubArgument<ParamsShape> = {}): ParamsShape =>
  orchestrationCallbacksContract.parse({
    onAgentEntryParams: {
      slotIndex: 0,
      entries: [AssistantTextChatEntryStub()],
      questWorkItemId: 'aaaaaaaa-1111-4222-9333-444444444444',
    },
    onWorkItemSessionIdParams: {
      workItemId: 'work-item-0',
      sessionId: 'test-session-id',
    },
    onFollowupCreatedParams: {
      followupWorkItemId: 'followup-item-0',
      role: 'spiritmender',
      failedWorkItemId: 'work-item-0',
    },
    onWorkItemSummaryParams: {
      workItemId: 'work-item-0',
      summary: 'Implemented feature with tests',
    },
    onWorkItemSignalParams: {
      workItemId: 'work-item-0',
      signal: 'complete',
    },
    ...props,
  });
