import { GuildIdStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { GuildChatResponder } from './guild-chat-responder';
import { GuildChatResponderProxy } from './guild-chat-responder.proxy';

describe('GuildChatResponder', () => {
  describe('successful chat spawn', () => {
    it('VALID: {valid guildId, message} => returns 200 with chatProcessId', async () => {
      const proxy = GuildChatResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-001' });

      proxy.setupGuildChat({ chatProcessId });

      const result = await proxy.callResponder({
        params: { guildId: GuildIdStub() },
        body: { message: 'help me build a feature' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'chat-proc-001' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null params} => returns 400 with error', async () => {
      GuildChatResponderProxy();

      const result = await GuildChatResponder({
        params: null,
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      GuildChatResponderProxy();

      const result = await GuildChatResponder({
        params: {},
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {null body} => returns 400 with error', async () => {
      GuildChatResponderProxy();

      const result = await GuildChatResponder({
        params: { guildId: GuildIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {missing message} => returns 400 with error', async () => {
      GuildChatResponderProxy();

      const result = await GuildChatResponder({
        params: { guildId: GuildIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('INVALID_MULTIPLE: {empty message} => returns 400 with error', async () => {
      GuildChatResponderProxy();

      const result = await GuildChatResponder({
        params: { guildId: GuildIdStub() },
        body: { message: '' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = GuildChatResponderProxy();
      proxy.setupError({ message: 'Guild not found' });

      const result = await proxy.callResponder({
        params: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });
});
