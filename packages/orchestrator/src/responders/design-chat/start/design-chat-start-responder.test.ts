import { GuildIdStub, QuestIdStub, QuestStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { DesignChatStartResponderProxy } from './design-chat-start-responder.proxy';

describe('DesignChatStartResponder', () => {
  describe('design chat start', () => {
    it('ERROR: {guildId + questId + message with explore_design quest} => rejects, emitting nothing, because glyphsmith has no chat prompt', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'explore_design' });

      proxy.setupDesignSession({ exitCode: ExitCodeStub({ value: 0 }), quest });

      const capture = proxy.setupEventCapture();

      await expect(
        proxy.callResponder({
          guildId,
          questId,
          message: 'Create login page prototype',
        }),
      ).rejects.toThrow(/^chatPromptBuildTransformer has no template for role 'glyphsmith'.*$/u);

      // `setupDesignSession` arms the staged child's stdout emit and its exit as two chained
      // `setImmediate`s, and the rejection above lands before anything spawns. Draining them is
      // what proves the emptiness below survives the abandoned lifecycle rather than merely
      // preceding it — and it clears the handle, which ward's open-handle gate otherwise reports
      // as still armed when this file ends, failing the package run with every check green.
      await new Promise((resolve) => {
        setImmediate(resolve);
      });
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(capture.getEmittedEvents()).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws quest not found error', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'nonexistent' });

      proxy.setupQuestNotFound();

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {quest in wrong status} => throws design status error', async () => {
      const proxy = DesignChatStartResponderProxy();
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'design-quest' });
      const quest = QuestStub({ id: 'design-quest', status: 'created' });

      proxy.setupInvalidStatus({ quest });

      await expect(
        proxy.callResponder({ guildId, questId, message: 'Create prototype' }),
      ).rejects.toThrow(/Quest must be in a design phase/u);
    });
  });
});
