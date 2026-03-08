import { GuildIdStub, QuestIdStub, QuestStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { chatLineProcessTransformer } from '../../../transformers/chat-line-process/chat-line-process-transformer';
import { designChatSpawnBroker } from './design-chat-spawn-broker';
import { designChatSpawnBrokerProxy } from './design-chat-spawn-broker.proxy';

describe('designChatSpawnBroker', () => {
  describe('valid design session', () => {
    it('VALID: {questId in explore_design status} => returns chatProcessId', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await designChatSpawnBroker({
        guildId,
        questId,
        message: 'Create login page prototype',
        processor: chatLineProcessTransformer(),
        onEntry: jest.fn(),
        onPatch: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toMatch(/^design-/u);
    });

    it('VALID: {questId in review_design status} => returns chatProcessId', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'review_design' });

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await designChatSpawnBroker({
        guildId,
        questId,
        message: 'Iterate on prototype',
        processor: chatLineProcessTransformer(),
        onEntry: jest.fn(),
        onPatch: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toMatch(/^design-/u);
    });

    it('VALID: {questId in design_approved status} => returns chatProcessId', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'design_approved' });

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const result = await designChatSpawnBroker({
        guildId,
        questId,
        message: 'Review approved design',
        processor: chatLineProcessTransformer(),
        onEntry: jest.fn(),
        onPatch: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess: jest.fn(),
      });

      expect(result.chatProcessId).toMatch(/^design-/u);
    });

    it('VALID: {design session} => calls registerProcess with kill function', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const registerProcess = jest.fn();

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      await designChatSpawnBroker({
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntry: jest.fn(),
        onPatch: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete: jest.fn(),
        registerProcess,
      });

      expect(registerProcess).toHaveBeenCalledTimes(1);
      expect(typeof registerProcess.mock.calls[0][0].processId).toBe('string');
      expect(typeof registerProcess.mock.calls[0][0].kill).toBe('function');
    });
  });

  describe('status guard', () => {
    it('ERROR: {questId in approved status} => throws design status error', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'approved' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        designChatSpawnBroker({
          guildId,
          questId,
          message: 'Create prototype',
          processor: chatLineProcessTransformer(),
          onEntry: jest.fn(),
          onPatch: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Quest must be in a design status/u);
    });

    it('ERROR: {questId in created status} => throws design status error', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'created' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        designChatSpawnBroker({
          guildId,
          questId,
          message: 'Create prototype',
          processor: chatLineProcessTransformer(),
          onEntry: jest.fn(),
          onPatch: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Current status: created/u);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {nonexistent questId} => throws quest not found error', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupQuestNotFound();

      await expect(
        designChatSpawnBroker({
          guildId,
          questId,
          message: 'Create prototype',
          processor: chatLineProcessTransformer(),
          onEntry: jest.fn(),
          onPatch: jest.fn(),
          onAgentDetected: jest.fn(),
          onComplete: jest.fn(),
          registerProcess: jest.fn(),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('process completion', () => {
    it('VALID: {process exits} => calls onComplete with chatProcessId, exitCode, and sessionId', async () => {
      const proxy = designChatSpawnBrokerProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const onComplete = jest.fn();

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const { chatProcessId } = await designChatSpawnBroker({
        guildId,
        questId,
        message: 'Create prototype',
        processor: chatLineProcessTransformer(),
        onEntry: jest.fn(),
        onPatch: jest.fn(),
        onAgentDetected: jest.fn(),
        onComplete,
        registerProcess: jest.fn(),
      });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete.mock.calls[0][0]).toStrictEqual({
        chatProcessId,
        exitCode: 0,
        sessionId: null,
      });
    });
  });
});
