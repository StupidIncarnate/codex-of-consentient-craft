import {
  AdapterResultStub,
  BlockedReasonStub,
  OperationItemIdStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorHandleSignalBackAdapter } from './orchestrator-handle-signal-back-adapter';
import { orchestratorHandleSignalBackAdapterProxy } from './orchestrator-handle-signal-back-adapter.proxy';

describe('orchestratorHandleSignalBackAdapter', () => {
  describe('successful invocation', () => {
    it('VALID: {questId, workItemId, signal: complete} => returns AdapterResult from StartOrchestrator', async () => {
      const proxy = orchestratorHandleSignalBackAdapterProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });
      const expected = AdapterResultStub();

      proxy.resolves({ questId, workItemId, result: expected });

      const result = await orchestratorHandleSignalBackAdapter({
        questId,
        workItemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual(expected);
    });

    // signalBackInputContract (mcp and server, both `.strict()`) has no `operationStatus` key —
    // StartOrchestrator.handleSignalBack's own type still carries the optional field, so a
    // regression that starts forwarding it again would typecheck silently. Asserting the FULL
    // call payload is what catches that: the address match above only compares the keys it names.
    it('VALID: {questId, workItemId, signal: complete, operationItemId, blockedReason} => calls StartOrchestrator.handleSignalBack with exactly those fields, and no operationStatus', async () => {
      const proxy = orchestratorHandleSignalBackAdapterProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });
      const operationItemId = OperationItemIdStub({
        value: 'cccccccc-3333-4444-9555-666666666666',
      });
      const blockedReason = BlockedReasonStub({ value: 'git commit is permission-denied' });

      proxy.resolves({ questId, workItemId, result: AdapterResultStub() });

      await orchestratorHandleSignalBackAdapter({
        questId,
        workItemId,
        signal: 'complete',
        operationItemId,
        blockedReason,
      });

      expect(proxy.getCallArgs({ questId, workItemId })).toStrictEqual({
        questId,
        workItemId,
        signal: 'complete',
        operationItemId,
        blockedReason,
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorHandleSignalBackAdapterProxy();
      const questId = QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' });
      const workItemId = QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' });

      proxy.throws({ questId, workItemId, error: new Error('post-walk hook failed') });

      await expect(
        orchestratorHandleSignalBackAdapter({
          questId,
          workItemId,
          signal: 'complete',
        }),
      ).rejects.toThrow(/post-walk hook failed/u);
    });
  });
});
