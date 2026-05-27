import {
  AdapterResultStub,
  QuestIdStub,
  QuestWorkItemIdStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorHandleSignalBackAdapter } from './orchestrator-handle-signal-back-adapter';
import { orchestratorHandleSignalBackAdapterProxy } from './orchestrator-handle-signal-back-adapter.proxy';

describe('orchestratorHandleSignalBackAdapter', () => {
  describe('successful invocation', () => {
    it('VALID: {questId, workItemId, signal: complete} => returns AdapterResult from StartOrchestrator', async () => {
      const proxy = orchestratorHandleSignalBackAdapterProxy();
      const expected = AdapterResultStub();

      proxy.resolves({ result: expected });

      const result = await orchestratorHandleSignalBackAdapter({
        questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
        workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
        signal: 'complete',
      });

      expect(result).toStrictEqual(expected);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorHandleSignalBackAdapterProxy();

      proxy.throws({ error: new Error('post-walk hook failed') });

      await expect(
        orchestratorHandleSignalBackAdapter({
          questId: QuestIdStub({ value: 'aaaaaaaa-1111-4222-9333-444444444444' }),
          workItemId: QuestWorkItemIdStub({ value: 'bbbbbbbb-2222-4333-9444-555555555555' }),
          signal: 'complete',
        }),
      ).rejects.toThrow(/post-walk hook failed/u);
    });
  });
});
