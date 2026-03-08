import { QuestStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationStartResponderProxy } from './orchestration-start-responder.proxy';

describe('OrchestrationStartResponder', () => {
  describe('quest validation', () => {
    it('VALID: {questId with approved quest} => returns processId', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('ERROR: {questId not found} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest not found: nonexistent/u,
      );
    });

    it('ERROR: {questId with non-approved quest} => throws status error', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'created' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotApproved({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        /Quest must be approved before starting\. Current status: created/u,
      );
    });

    it('VALID: {questId with design_approved quest} => returns processId', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'design_approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });

  describe('state registration', () => {
    it('VALID: {questId with approved quest} => registers process in orchestration state', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', steps: [] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestApproved({ quest });

      const processId = await proxy.callResponder({ questId });

      expect(processId).toBe('proc-f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });
});
