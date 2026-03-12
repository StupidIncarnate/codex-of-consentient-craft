import {
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
} from '@dungeonmaster/shared/contracts';

import { ChatRoleStub } from '../../../contracts/chat-role/chat-role.stub';
import { resolveQuestLayerBroker } from './resolve-quest-layer-broker';
import { resolveQuestLayerBrokerProxy } from './resolve-quest-layer-broker.proxy';

describe('resolveQuestLayerBroker', () => {
  describe('chaoswhisperer role', () => {
    it('VALID: {chaoswhisperer + no sessionId} => creates quest and calls onQuestCreated', async () => {
      const proxy = resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'chaoswhisperer' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'chat-test-123' });
      const onQuestCreated = jest.fn();

      proxy.setupQuestCreation();

      const result = await resolveQuestLayerBroker({
        role,
        message: 'Build auth',
        guildId,
        chatProcessId,
        onQuestCreated,
      });

      expect(typeof result).toBe('string');
      expect(result).not.toBeNull();
      expect(onQuestCreated).toHaveBeenCalledTimes(1);
      expect(onQuestCreated.mock.calls[0][0].chatProcessId).toBe(chatProcessId);
    });

    it('VALID: {chaoswhisperer + sessionId} => returns null without creating quest', async () => {
      resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'chaoswhisperer' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'chat-test-456' });
      const sessionId = SessionIdStub({ value: 'session-resume-123' });
      const onQuestCreated = jest.fn();

      const result = await resolveQuestLayerBroker({
        role,
        message: 'Continue',
        guildId,
        chatProcessId,
        sessionId,
        onQuestCreated,
      });

      expect(result).toBeNull();
      expect(onQuestCreated).toHaveBeenCalledTimes(0);
    });

    it('ERROR: {chaoswhisperer + quest creation fails} => throws', async () => {
      const proxy = resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'chaoswhisperer' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'chat-test-789' });

      proxy.setupQuestCreationFailure();

      await expect(
        resolveQuestLayerBroker({
          role,
          message: 'Build auth',
          guildId,
          chatProcessId,
        }),
      ).rejects.toThrow(/Failed to create quest/u);
    });
  });

  describe('glyphsmith role', () => {
    it('VALID: {glyphsmith + questId in explore_design} => returns questId', async () => {
      const proxy = resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'design-test-123' });

      proxy.setupQuestFound({ quest });

      const result = await resolveQuestLayerBroker({
        role,
        questId,
        message: 'Create prototype',
        guildId,
        chatProcessId,
      });

      expect(result).toBe('design-quest');
    });

    it('ERROR: {glyphsmith + no questId} => throws', async () => {
      resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'glyphsmith' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'design-test-456' });

      await expect(
        resolveQuestLayerBroker({
          role,
          message: 'Create prototype',
          guildId,
          chatProcessId,
        }),
      ).rejects.toThrow(/questId is required for glyphsmith role/u);
    });

    it('ERROR: {glyphsmith + quest not found} => throws', async () => {
      const proxy = resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'nonexistent' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'design-test-789' });

      proxy.setupQuestNotFound();

      await expect(
        resolveQuestLayerBroker({
          role,
          questId,
          message: 'Create prototype',
          guildId,
          chatProcessId,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {glyphsmith + quest in invalid status} => throws', async () => {
      const proxy = resolveQuestLayerBrokerProxy();
      const role = ChatRoleStub({ value: 'glyphsmith' });
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'created' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'design-test-000' });

      proxy.setupQuestFound({ quest });

      await expect(
        resolveQuestLayerBroker({
          role,
          questId,
          message: 'Create prototype',
          guildId,
          chatProcessId,
        }),
      ).rejects.toThrow(/Quest must be in a design status/u);
    });
  });
});
