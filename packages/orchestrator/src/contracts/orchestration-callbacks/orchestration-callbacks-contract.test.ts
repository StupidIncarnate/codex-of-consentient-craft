/**
 * PURPOSE: Tests orchestration callbacks contract validation
 *
 * USAGE: npm run ward -- --only unit -- packages/orchestrator/src/contracts/orchestration-callbacks/orchestration-callbacks-contract.test.ts
 */

import { orchestrationCallbacksContract } from './orchestration-callbacks-contract';
import { OrchestrationCallbacksParamsStub } from './orchestration-callbacks.stub';

describe('orchestrationCallbacksContract', () => {
  it('VALID: {all params} => parses all four callback param shapes', () => {
    const result = OrchestrationCallbacksParamsStub();

    expect(result).toStrictEqual({
      onAgentEntryParams: {
        slotIndex: 0,
        entry: { raw: 'test line' },
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
    });
  });

  it('VALID: {custom onAgentEntryParams} => overrides defaults', () => {
    const result = OrchestrationCallbacksParamsStub({
      onAgentEntryParams: { slotIndex: 2 as never, entry: { custom: true } },
    });

    expect(result.onAgentEntryParams.slotIndex).toBe(2);
    expect(result.onAgentEntryParams.entry).toStrictEqual({ custom: true });
  });

  it('VALID: {custom onFollowupCreatedParams} => overrides defaults', () => {
    const result = OrchestrationCallbacksParamsStub({
      onFollowupCreatedParams: {
        followupWorkItemId: 'custom-followup' as never,
        role: 'codeweaver' as never,
        failedWorkItemId: 'custom-failed' as never,
      },
    });

    expect(result.onFollowupCreatedParams).toStrictEqual({
      followupWorkItemId: 'custom-followup',
      role: 'codeweaver',
      failedWorkItemId: 'custom-failed',
    });
  });

  it('VALID: {custom onWorkItemSummaryParams} => overrides defaults', () => {
    const result = OrchestrationCallbacksParamsStub({
      onWorkItemSummaryParams: {
        workItemId: 'custom-item' as never,
        summary: 'Fixed auth bug and added tests' as never,
      },
    });

    expect(result.onWorkItemSummaryParams).toStrictEqual({
      workItemId: 'custom-item',
      summary: 'Fixed auth bug and added tests',
    });
  });

  it('INVALID: {missing params} => throws validation error', () => {
    expect(() => {
      orchestrationCallbacksContract.parse({});
    }).toThrow(/Required/u);
  });

  it('INVALID: {onWorkItemSummaryParams missing summary} => throws validation error', () => {
    expect(() => {
      orchestrationCallbacksContract.parse({
        onAgentEntryParams: { slotIndex: 0, entry: {} },
        onWorkItemSessionIdParams: { workItemId: 'work-item-0', sessionId: 'test-session-id' },
        onFollowupCreatedParams: {
          followupWorkItemId: 'followup-item-0',
          role: 'spiritmender',
          failedWorkItemId: 'work-item-0',
        },
        onWorkItemSummaryParams: { workItemId: 'work-item-0' },
      });
    }).toThrow(/Required/u);
  });

  it('VALID: {onAgentEntryParams with optional sessionId} => includes sessionId when provided', () => {
    const result = OrchestrationCallbacksParamsStub({
      onAgentEntryParams: {
        slotIndex: 1 as never,
        entry: { line: 'output' },
        sessionId: 'agent-session-1' as never,
      },
    });

    expect(result.onAgentEntryParams).toStrictEqual({
      slotIndex: 1,
      entry: { line: 'output' },
      sessionId: 'agent-session-1',
    });
  });
});
