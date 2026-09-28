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
      const guildId = GuildIdStub({ value: '38c6cbd2-8bf1-6507-8d07-0980dd1fb595' });

      proxy.setupRejected({ status: 500, error: '' });

      await expect(
        questNewBroker({ guildId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(
        /^POST \/api\/guilds\/38c6cbd2-8bf1-6507-8d07-0980dd1fb595\/quests failed with status 500$/u,
      );
    });
  });

  describe('network failure', () => {
    it('ERROR: {network error} => throws network error naming the url', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '1c27ba90-c110-14f0-94be-250818fd3443' });

      proxy.setupError();

      await expect(
        questNewBroker({ guildId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(
        /network error posting to \/api\/guilds\/1c27ba90-c110-14f0-94be-250818fd3443\/quests/u,
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
      const guildId = GuildIdStub({ value: '4c78841e-022a-87d0-8928-189580cb01c5' });
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
      const guildId = GuildIdStub({ value: '00118165-fbf1-11d4-8940-5ee9492debae' });
      const message = UserInputStub({ value: 'Just text' });

      proxy.setupNew({ questId: QuestIdStub(), chatProcessId: ProcessIdStub() });

      await questNewBroker({ guildId, message });

      expect((await proxy.getRequestBodies()).at(-1)).toStrictEqual({
        message: 'Just text',
      });
    });

    it('EDGE: {images: []} => posts body with no images key', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '35fd5b8f-551b-8baf-b8fb-a5c4702e7b71' });
      const message = UserInputStub({ value: 'No attachments' });

      proxy.setupNew({ questId: QuestIdStub(), chatProcessId: ProcessIdStub() });

      await questNewBroker({ guildId, message, images: [] });

      expect((await proxy.getRequestBodies()).at(-1)).toStrictEqual({
        message: 'No attachments',
      });
    });

    it('VALID: #check-create-post-carries-images {message with two pasted-image tokens, two images} => posts the message plus both images in order at the resolved create route', async () => {
      const proxy = questNewBrokerProxy();
      const guildId = GuildIdStub({ value: '97241aaa-ae56-6f58-b9ec-a952ee85b407' });
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
      expect(proxy.getRequestUrl()).toBe('/api/guilds/97241aaa-ae56-6f58-b9ec-a952ee85b407/quests');
    });
  });
});
