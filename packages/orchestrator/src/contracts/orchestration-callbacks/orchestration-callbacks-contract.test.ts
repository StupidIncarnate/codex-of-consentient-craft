/**
 * PURPOSE: Tests orchestration callbacks contract validation
 *
 * USAGE: npm run ward -- --only unit -- packages/orchestrator/src/contracts/orchestration-callbacks/orchestration-callbacks-contract.test.ts
 */

import { orchestrationCallbacksContract } from './orchestration-callbacks-contract';
import { OrchestrationCallbacksParamsStub } from './orchestration-callbacks.stub';

describe('orchestrationCallbacksContract', () => {
  it('VALID: {all params} => parses successfully', () => {
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
      onWorkItemSignalParams: {
        workItemId: 'work-item-0',
        signal: 'complete',
      },
    });
  });

  it('VALID: {custom onAgentEntryParams} => overrides defaults', () => {
    const result = OrchestrationCallbacksParamsStub({
      onAgentEntryParams: { slotIndex: 2 as never, entry: { custom: true } },
    });

    expect(result.onAgentEntryParams).toStrictEqual({
      slotIndex: 2,
      entry: { custom: true },
    });
  });

  it('VALID: {custom onFollowupCreatedParams} => overrides defaults', () => {
    const result = OrchestrationCallbacksParamsStub({
      onFollowupCreatedParams: {
        followupWorkItemId: 'custom-followup' as never,
        role: 'codeweaver' as never,
        failedWorkItemId: 'custom-failed' as never,
      },
    });

    expect(result.onFollowupCreatedParams.role).toBe('codeweaver');
  });

  it('INVALID: {missing params} => throws validation error', () => {
    expect(() => {
      orchestrationCallbacksContract.parse({});
    }).toThrow(/Required/u);
  });
});
