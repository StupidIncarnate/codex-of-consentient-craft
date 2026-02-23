import { GuildIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';
import { QuestListResponderProxy } from './quest-list-responder.proxy';

describe('QuestListResponder', () => {
  describe('successful listing', () => {
    it('VALID: {valid guildId} => returns 200 with quests array', async () => {
      const proxy = QuestListResponderProxy();
      const quest = QuestListItemStub();
      proxy.setupListQuests({ quests: [quest] });
      const guildId = GuildIdStub();

      const result = await proxy.callResponder({ query: { guildId } });

      expect(result).toStrictEqual({
        status: 200,
        data: [quest],
      });
    });

    it('EMPTY: {no quests} => returns 200 with empty array', async () => {
      const proxy = QuestListResponderProxy();
      proxy.setupListQuests({ quests: [] });
      const guildId = GuildIdStub();

      const result = await proxy.callResponder({ query: { guildId } });

      expect(result).toStrictEqual({
        status: 200,
        data: [],
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null query} => returns 400 with error', async () => {
      const proxy = QuestListResponderProxy();

      const result = await proxy.callResponder({ query: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid query' },
      });
    });

    it('INVALID_MULTIPLE: {non-object query} => returns 400 with error', async () => {
      const proxy = QuestListResponderProxy();

      const result = await proxy.callResponder({ query: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid query' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      const proxy = QuestListResponderProxy();

      const result = await proxy.callResponder({ query: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId query parameter is required' },
      });
    });

    it('INVALID_MULTIPLE: {guildId is number} => returns 400 with error', async () => {
      const proxy = QuestListResponderProxy();

      const result = await proxy.callResponder({ query: { guildId: 123 } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId query parameter is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestListResponderProxy();

      proxy.setupListQuestsError({ message: 'Connection failed' });

      const result = await proxy.callResponder({
        query: { guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Connection failed' },
      });
    });
  });
});
