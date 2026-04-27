import { GuildIdStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { QuestNewResponder } from './quest-new-responder';
import { QuestNewResponderProxy } from './quest-new-responder.proxy';

describe('QuestNewResponder', () => {
  describe('successful new quest', () => {
    it('VALID: {guildId in params, message in body, adapter returns questId} => returns 200 with questId and chatProcessId', async () => {
      const proxy = QuestNewResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-new-quest' });
      const questId = QuestIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupQuestNew({ chatProcessId, questId });

      const result = await proxy.callResponder({
        params: { guildId: GuildIdStub() },
        body: { message: 'help me build auth' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: {
          chatProcessId: 'proc-new-quest',
          questId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      });
    });

    it('VALID: {adapter omits questId} => returns 200 with chatProcessId only', async () => {
      const proxy = QuestNewResponderProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-no-quest' });

      proxy.setupQuestNew({ chatProcessId });

      const result = await proxy.callResponder({
        params: { guildId: GuildIdStub() },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-no-quest' },
      });
    });
  });

  describe('validation errors', () => {
    it('ERROR: {null params} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
        params: null,
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('ERROR: {missing guildId in params} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
        params: {},
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('ERROR: {malformed guildId (non-UUID string)} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
        params: { guildId: 'not-a-uuid' },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('ERROR: {null body} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
        params: { guildId: GuildIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('ERROR: {missing message in body} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
        params: { guildId: GuildIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('ERROR: {empty message string in body} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
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
      const proxy = QuestNewResponderProxy();
      proxy.setupError({ message: 'Guild not found' });

      const result = await proxy.callResponder({
        params: { guildId: GuildIdStub() },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });
});
