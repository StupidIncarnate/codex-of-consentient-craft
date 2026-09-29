/**
 * PURPOSE: Tests orchestration callbacks contract validation
 *
 * USAGE: npm run ward -- --only unit -- packages/orchestrator/src/contracts/orchestration-callbacks/orchestration-callbacks-contract.test.ts
 */

import { AssistantTextChatEntryStub } from '@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub';

import { orchestrationCallbacksContract } from './orchestration-callbacks-contract';
import { OrchestrationCallbacksParamsStub } from './orchestration-callbacks.stub';

describe('orchestrationCallbacksContract', () => {
  it('VALID: {all params} => parses successfully', () => {
    const fixedEntry = AssistantTextChatEntryStub({
      uuid: 'eeeeeeee-1111-4222-9333-444444444444',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    const result = OrchestrationCallbacksParamsStub({
      onAgentEntryParams: {
        slotIndex: 0,
        entries: [fixedEntry],
        questWorkItemId: 'aaaaaaaa-1111-4222-9333-444444444444',
      },
    });

    expect(result).toStrictEqual({
      onAgentEntryParams: {
        slotIndex: 0,
        entries: [fixedEntry],
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
    });
  });

  it('VALID: {custom onAgentEntryParams} => overrides defaults', () => {
    const customEntry = AssistantTextChatEntryStub({
      uuid: 'ffffffff-1111-4222-9333-444444444444',
      timestamp: '2026-01-01T00:00:00.000Z',
      content: 'custom content',
    });
    const result = OrchestrationCallbacksParamsStub({
      onAgentEntryParams: {
        slotIndex: 2,
        entries: [customEntry],
        questWorkItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
      },
    });

    expect(result.onAgentEntryParams).toStrictEqual({
      slotIndex: 2,
      entries: [customEntry],
      questWorkItemId: 'bbbbbbbb-1111-4222-9333-444444444444',
    });
  });

  it('VALID: {custom onFollowupCreatedParams} => overrides defaults', () => {
    const result = OrchestrationCallbacksParamsStub({
      onFollowupCreatedParams: {
        followupWorkItemId: 'custom-followup',
        role: 'codeweaver',
        failedWorkItemId: 'custom-failed',
      },
    });

    expect(result.onFollowupCreatedParams.role).toBe('codeweaver');
  });

  it('INVALID: {missing params} => throws validation error', () => {
    expect(() => {
      orchestrationCallbacksContract.parse({});
    }).toThrow(/received undefined/u);
  });
});
