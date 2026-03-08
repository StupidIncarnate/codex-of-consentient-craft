import { GuildIdStub, GuildStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';
import { DesignStartResponderProxy } from './design-start-responder.proxy';

describe('DesignStartResponder', () => {
  describe('successful start', () => {
    it('VALID: {approved quest with needsDesign} => returns 200 with port', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const quest = QuestStub({ status: 'approved' as never, needsDesign: true });
      const guild = GuildStub({ id: guildId, path: '/home/user/project' as never });

      proxy.setupQuest({ quest });
      proxy.setupGuild({ guild });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId },
      });

      expect(result.status).toBe(200);
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();

      const result = await proxy.callResponder({ params: null, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {missing guildId} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();

      const result = await proxy.callResponder({
        params: { questId },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {quest not approved} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const quest = QuestStub({ status: 'created' as never, needsDesign: true });

      proxy.setupQuest({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Quest must be approved with needsDesign=true to start design' },
      });
    });

    it('INVALID: {needsDesign false} => returns 400', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const quest = QuestStub({ status: 'approved' as never, needsDesign: false });

      proxy.setupQuest({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Quest must be approved with needsDesign=true to start design' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest fetch fails} => returns 500', async () => {
      const proxy = DesignStartResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      proxy.setupQuestError({ error: new Error('Quest fetch failed') });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest fetch failed' },
      });
    });
  });
});
