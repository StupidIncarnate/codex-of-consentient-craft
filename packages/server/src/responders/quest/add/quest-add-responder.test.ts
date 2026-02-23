import { QuestAddResponderProxy } from './quest-add-responder.proxy';

describe('QuestAddResponder', () => {
  describe('successful creation', () => {
    it('VALID: {title, userRequest, guildId} => returns 201 with result', async () => {
      const proxy = QuestAddResponderProxy();
      const { expectedData } = proxy.setupAddQuest();

      const result = await proxy.callResponder({
        body: {
          title: 'My Quest',
          userRequest: 'Do something',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      });

      expect(result).toStrictEqual({
        status: 201,
        data: expectedData,
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID_MULTIPLE: {null body} => returns 400 with error', async () => {
      const proxy = QuestAddResponderProxy();

      const result = await proxy.callResponder({ body: null });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {non-object body} => returns 400 with error', async () => {
      const proxy = QuestAddResponderProxy();

      const result = await proxy.callResponder({ body: 'not-an-object' });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID_MULTIPLE: {missing title and userRequest} => returns 400 with error', async () => {
      const proxy = QuestAddResponderProxy();

      const result = await proxy.callResponder({ body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'title and userRequest are required strings' },
      });
    });

    it('INVALID_MULTIPLE: {title is number} => returns 400 with error', async () => {
      const proxy = QuestAddResponderProxy();

      const result = await proxy.callResponder({ body: { title: 123, userRequest: 'Do X' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'title and userRequest are required strings' },
      });
    });

    it('INVALID_MULTIPLE: {missing guildId} => returns 400 with error', async () => {
      const proxy = QuestAddResponderProxy();

      const result = await proxy.callResponder({
        body: { title: 'My Quest', userRequest: 'Do X' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID_MULTIPLE: {guildId is number} => returns 400 with error', async () => {
      const proxy = QuestAddResponderProxy();

      const result = await proxy.callResponder({
        body: { title: 'My Quest', userRequest: 'Do X', guildId: 123 },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestAddResponderProxy();
      proxy.setupAddQuestError({ message: 'Failed to create' });

      const result = await proxy.callResponder({
        body: {
          title: 'Test',
          userRequest: 'Do X',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Failed to create' },
      });
    });
  });
});
