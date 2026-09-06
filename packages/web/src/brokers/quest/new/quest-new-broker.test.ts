import {
  GuildIdStub,
  PastedImageUploadStub,
  ProcessIdStub,
  QuestIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { questNewBroker } from './quest-new-broker';
import { questNewBrokerProxy } from './quest-new-broker.proxy';

describe('questNewBroker', () => {
  describe('successful new quest', () => {
    it('VALID: {guildId, message} => returns questId and chatProcessId', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub();
      const message = UserInputStub({ value: 'Add auth' });
      const questId = QuestIdStub({ value: 'quest-new-1' });
      const chatProcessId = ProcessIdStub({ value: 'proc-new-1' });

      proxy.setupNew({ questId, chatProcessId });

      const result = await questNewBroker({ guildId, message });

      expect(result).toStrictEqual({
        questId: 'quest-new-1',
        chatProcessId: 'proc-new-1',
      });
    });
  });

  describe('200 response parsing', () => {
    it('EDGE: {200 with neither questId nor chatProcessId} => throws naming the missing fields', async () => {
      const proxy = questNewBrokerProxy();
      proxy.setupInvalidResponse({ questId: undefined, chatProcessId: undefined });

      await expect(
        questNewBroker({
          guildId: GuildIdStub(),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/returned 200 with no questId or chatProcessId/u);
    });

    it('INVALID: {chatProcessId: 42} => throws naming the missing fields', async () => {
      const proxy = questNewBrokerProxy();
      proxy.setupInvalidResponse({
        questId: QuestIdStub({ value: 'quest-1' }),
        chatProcessId: 42,
      });

      await expect(
        questNewBroker({
          guildId: GuildIdStub(),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/returned 200 with no questId or chatProcessId/u);
    });
  });

  describe('non-ok rejection', () => {
    it('ERROR: {404 with server error body} => throws the exact server error text', async () => {
      const proxy = questNewBrokerProxy();

      proxy.setupRejected({ status: 404, error: 'Guild not found' });

      await expect(
        questNewBroker({
          guildId: GuildIdStub(),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/^Guild not found$/u);
    });

    it('EDGE: {500 with no usable error body} => throws a generic status message', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '11111111-1111-1111-1111-111111111111' });

      proxy.setupRejected({ status: 500, error: '' });

      await expect(
        questNewBroker({ guildId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(
        /^POST \/api\/guilds\/11111111-1111-1111-1111-111111111111\/quests failed with status 500$/u,
      );
    });
  });

  describe('network failure', () => {
    it('ERROR: {network error} => throws network error naming the url', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '22222222-2222-2222-2222-222222222222' });

      proxy.setupError();

      await expect(
        questNewBroker({ guildId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(
        /network error posting to \/api\/guilds\/22222222-2222-2222-2222-222222222222\/quests/u,
      );
    });
  });

  describe('request count', () => {
    it('VALID: {one send} => getRequestCount returns 1', async () => {
      const proxy = questNewBrokerProxy();

      proxy.setupNew({
        questId: QuestIdStub({ value: 'quest-count-1' }),
        chatProcessId: ProcessIdStub({ value: 'proc-count-1' }),
      });

      await questNewBroker({ guildId: GuildIdStub(), message: UserInputStub({ value: 'Hi' }) });

      expect(proxy.getRequestCount()).toBe(1);
    });
  });

  describe('request body shape', () => {
    it('VALID: {questType: bug-hunt} => posts body carrying questType', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '33333333-3333-3333-3333-333333333333' });
      const message = UserInputStub({ value: 'Investigate crash' });

      proxy.setupNew({ questId: QuestIdStub(), chatProcessId: ProcessIdStub() });

      await questNewBroker({ guildId, message, questType: 'bug-hunt' });

      expect((await proxy.getRequestBodies()).at(-1)).toStrictEqual({
        message: 'Investigate crash',
        questType: 'bug-hunt',
      });
    });

    it('VALID: {text-only create, no questType or images} => posts body with no images key', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '44444444-4444-4444-4444-444444444444' });
      const message = UserInputStub({ value: 'Just text' });

      proxy.setupNew({ questId: QuestIdStub(), chatProcessId: ProcessIdStub() });

      await questNewBroker({ guildId, message });

      expect((await proxy.getRequestBodies()).at(-1)).toStrictEqual({
        message: 'Just text',
      });
    });

    it('EDGE: {images: []} => posts body with no images key', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '55555555-5555-5555-5555-555555555555' });
      const message = UserInputStub({ value: 'No attachments' });

      proxy.setupNew({ questId: QuestIdStub(), chatProcessId: ProcessIdStub() });

      await questNewBroker({ guildId, message, images: [] });

      expect((await proxy.getRequestBodies()).at(-1)).toStrictEqual({
        message: 'No attachments',
      });
    });

    it('VALID: #check-create-post-carries-images {message with two pasted-image tokens, two images} => posts the message plus both images in order at the resolved create route', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '66666666-6666-6666-6666-666666666666' });
      const message = UserInputStub({ value: 'See [Pasted Image 1] and [Pasted Image 2]' });
      const firstImage = PastedImageUploadStub({
        mediaType: 'image/png',
        dataBase64: 'aGVsbG8=',
      });
      const secondImage = PastedImageUploadStub({
        mediaType: 'image/jpeg',
        dataBase64: 'd29ybGQ=',
      });

      proxy.setupNew({ questId: QuestIdStub(), chatProcessId: ProcessIdStub() });

      await questNewBroker({ guildId, message, images: [firstImage, secondImage] });

      expect((await proxy.getRequestBodies()).at(-1)).toStrictEqual({
        message: 'See [Pasted Image 1] and [Pasted Image 2]',
        images: [
          { mediaType: 'image/png', dataBase64: 'aGVsbG8=' },
          { mediaType: 'image/jpeg', dataBase64: 'd29ybGQ=' },
        ],
      });
      expect(proxy.getRequestUrl()).toBe('/api/guilds/66666666-6666-6666-6666-666666666666/quests');
    });
  });
});
