import { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { DesignSessionResponderProxy } from './design-session-responder.proxy';

describe('DesignSessionResponder', () => {
  describe('successful chat', () => {
    it('VALID: {questId, guildId, message} => returns 200 with chatProcessId', async () => {
      const proxy = DesignSessionResponderProxy();
      const chatProcessId = ProcessIdStub();
      proxy.setupDesignChat({ chatProcessId });

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub(), message: 'Update the button color' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({ params: null, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {missing guildId} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {missing message} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('INVALID: {empty message} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub(), message: '' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500', async () => {
      const proxy = DesignSessionResponderProxy();
      proxy.setupDesignChatError({ error: new Error('Design chat failed') });

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub(), message: 'Update button' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Design chat failed' },
      });
    });
  });
});
