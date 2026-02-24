import { GuildIdStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';
import { SessionNewResponder } from './session-new-responder';
import { SessionNewResponderProxy } from './session-new-responder.proxy';

describe('SessionNewResponder', () => {
  describe('successful session creation', () => {
    it('VALID: {guildId, message in body} => returns 200 with chatProcessId', async () => {
      const proxy = SessionNewResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'chat-proc-001' });

      proxy.setupSessionNew({ chatProcessId });

      const result = await proxy.callResponder({
        body: { guildId: GuildIdStub(), message: 'help me build a feature' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'chat-proc-001' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null body} => returns 400 with error', async () => {
      SessionNewResponderProxy();

      const result = await SessionNewResponder({
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      SessionNewResponderProxy();

      const result = await SessionNewResponder({
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {missing message} => returns 400 with error', async () => {
      SessionNewResponderProxy();

      const result = await SessionNewResponder({
        body: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('INVALID_MULTIPLE: {empty message} => returns 400 with error', async () => {
      SessionNewResponderProxy();

      const result = await SessionNewResponder({
        body: { guildId: GuildIdStub(), message: '' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = SessionNewResponderProxy();
      proxy.setupError({ message: 'Guild not found' });

      const result = await proxy.callResponder({
        body: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });
});
