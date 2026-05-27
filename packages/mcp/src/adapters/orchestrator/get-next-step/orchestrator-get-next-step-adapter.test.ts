import { NextStepStub } from '@dungeonmaster/orchestrator/testing';

import { orchestratorGetNextStepAdapter } from './orchestrator-get-next-step-adapter';
import { orchestratorGetNextStepAdapterProxy } from './orchestrator-get-next-step-adapter.proxy';

describe('orchestratorGetNextStepAdapter', () => {
  describe('successful poll', () => {
    it('VALID: {} => returns NextStep', async () => {
      const proxy = orchestratorGetNextStepAdapterProxy();
      const step = NextStepStub({ type: 'idle' });

      proxy.returns({ step });

      const result = await orchestratorGetNextStepAdapter();

      expect(result).toStrictEqual(step);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetNextStepAdapterProxy();

      proxy.throws({ error: new Error('Get next step failed') });

      await expect(orchestratorGetNextStepAdapter()).rejects.toThrow(/Get next step failed/u);
    });
  });
});
