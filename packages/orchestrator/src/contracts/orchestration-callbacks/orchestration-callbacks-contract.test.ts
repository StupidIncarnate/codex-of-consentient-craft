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

    expect(result.onAgentEntryParams.slotIndex).toBe(0);
    expect(result.onWorkItemSessionIdParams.workItemId).toBe('work-item-0');
    expect(result.onFollowupCreatedParams.role).toBe('spiritmender');
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

    expect(result.onFollowupCreatedParams.role).toBe('codeweaver');
  });

  it('INVALID: {missing params} => throws validation error', () => {
    expect(() => {
      orchestrationCallbacksContract.parse({});
    }).toThrow(/Required/u);
  });
});
