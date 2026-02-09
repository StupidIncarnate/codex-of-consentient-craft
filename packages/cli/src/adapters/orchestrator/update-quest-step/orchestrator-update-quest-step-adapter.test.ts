/**
 * PURPOSE: Tests for orchestratorUpdateQuestStepAdapter
 */
import { FilePathStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorUpdateQuestStepAdapter } from './orchestrator-update-quest-step-adapter';
import { orchestratorUpdateQuestStepAdapterProxy } from './orchestrator-update-quest-step-adapter.proxy';

describe('orchestratorUpdateQuestStepAdapter', () => {
  describe('successful updates', () => {
    it('VALID: {questFilePath, stepId, updates} => updates step via orchestrator', async () => {
      const proxy = orchestratorUpdateQuestStepAdapterProxy();
      const questFilePath = FilePathStub({
        value: '/project/.dungeonmaster-quests/001-test/quest.json',
      });
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      proxy.succeeds();

      await expect(
        orchestratorUpdateQuestStepAdapter({
          questFilePath,
          stepId,
          updates: { status: 'in_progress' },
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator error} => throws error', async () => {
      const proxy = orchestratorUpdateQuestStepAdapterProxy();
      const questFilePath = FilePathStub({ value: '/nonexistent/quest.json' });
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      proxy.throws({ error: new Error('Failed to update step') });

      await expect(
        orchestratorUpdateQuestStepAdapter({
          questFilePath,
          stepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/Failed to update step/u);
    });
  });
});
