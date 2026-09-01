import { GuildIdStub, QuestIdStub, PastedImageUploadStub } from '@dungeonmaster/shared/contracts';

import { pastedImagePersistBroker } from './pasted-image-persist-broker';
import { pastedImagePersistBrokerProxy } from './pasted-image-persist-broker.proxy';

describe('pastedImagePersistBroker', () => {
  describe('single image', () => {
    it('VALID: {images: [one image], message carrying its token} => creates the images dir, writes the file, and rewrites the token to the written path', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const imageId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      proxy.stageImageIds({ ids: [imageId] });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'look at this [Pasted Image 1] please',
        images: [image],
      });

      const expectedPath = `${imagesDirPath}/${imageId}.png`;

      expect(proxy.mkdirRequestedDirPaths()).toStrictEqual([imagesDirPath]);
      expect(proxy.writtenPayloadFor({ filePath: expectedPath })).toBe('aGVsbG8=');
      expect(result).toBe(`look at this ![Pasted Image 1](${expectedPath}) please`);
    });
  });

  describe('two images in one message', () => {
    it('VALID: {images: [png, jpeg], message carrying two tokens} => writes both files in posted order and each token names its own image file', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const firstId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      const secondId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
      proxy.stageImageIds({ ids: [firstId, secondId] });
      const firstImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });
      const secondImage = PastedImageUploadStub({
        mediaType: 'image/jpeg',
        dataBase64: 'd29ybGQ=',
      });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: '[Pasted Image 1] and [Pasted Image 2]',
        images: [firstImage, secondImage],
      });

      const firstPath = `${imagesDirPath}/${firstId}.png`;
      const secondPath = `${imagesDirPath}/${secondId}.jpeg`;

      expect(result).toBe(`![Pasted Image 1](${firstPath}) and ![Pasted Image 2](${secondPath})`);
      expect(proxy.writtenPayloadFor({ filePath: firstPath })).toBe('aGVsbG8=');
      expect(proxy.writtenPayloadFor({ filePath: secondPath })).toBe('d29ybGQ=');
    });
  });

  describe('two sends into the same quest', () => {
    it('VALID: {two calls, same guildId/questId} => both calls asked mkdir for the same images dir, and four writes reached fs in total', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      proxy.stageImageIds({
        ids: [
          'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          'ffffffff-ffff-4fff-8fff-ffffffffffff',
          '11111111-1111-4111-8111-111111111111',
        ],
      });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });

      await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'first [Pasted Image 1] and [Pasted Image 2]',
        images: [image, image],
      });
      await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'second [Pasted Image 1] and [Pasted Image 2]',
        images: [image, image],
      });

      expect(proxy.mkdirRequestedDirPaths()).toStrictEqual([imagesDirPath, imagesDirPath]);
      expect(proxy.writeCallCount()).toBe(4);
    });

    it('VALID: {two calls, byte-identical images} => the four written paths are distinct, and each rewritten message names its own send file', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const id1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
      const id2 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
      const id3 = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
      const id4 = '11111111-1111-4111-8111-111111111111';
      proxy.stageImageIds({ ids: [id1, id2, id3, id4] });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });

      const firstResult = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'first [Pasted Image 1] and [Pasted Image 2]',
        images: [image, image],
      });
      const secondResult = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'second [Pasted Image 1] and [Pasted Image 2]',
        images: [image, image],
      });

      const path1 = `${imagesDirPath}/${id1}.png`;
      const path2 = `${imagesDirPath}/${id2}.png`;
      const path3 = `${imagesDirPath}/${id3}.png`;
      const path4 = `${imagesDirPath}/${id4}.png`;

      expect(firstResult).toBe(`first ![Pasted Image 1](${path1}) and ![Pasted Image 2](${path2})`);
      expect(secondResult).toBe(
        `second ![Pasted Image 1](${path3}) and ![Pasted Image 2](${path4})`,
      );
    });

    it('VALID: {two calls, byte-identical images} => all four written payloads still decode to the posted bytes, including the first send after the second has run', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const id1 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
      const id2 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
      const id3 = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
      const id4 = '11111111-1111-4111-8111-111111111111';
      proxy.stageImageIds({ ids: [id1, id2, id3, id4] });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });

      await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'first [Pasted Image 1] and [Pasted Image 2]',
        images: [image, image],
      });
      await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'second [Pasted Image 1] and [Pasted Image 2]',
        images: [image, image],
      });

      const path1 = `${imagesDirPath}/${id1}.png`;
      const path2 = `${imagesDirPath}/${id2}.png`;
      const path3 = `${imagesDirPath}/${id3}.png`;
      const path4 = `${imagesDirPath}/${id4}.png`;

      expect(proxy.writtenPayloadFor({ filePath: path1 })).toBe('aGVsbG8=');
      expect(proxy.writtenPayloadFor({ filePath: path2 })).toBe('aGVsbG8=');
      expect(proxy.writtenPayloadFor({ filePath: path3 })).toBe('aGVsbG8=');
      expect(proxy.writtenPayloadFor({ filePath: path4 })).toBe('aGVsbG8=');
    });
  });

  describe('empty images', () => {
    it('EMPTY: {images: []} => still creates the images dir, writes nothing, and returns the message unchanged', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'no images here',
        images: [],
      });

      expect(result).toBe('no images here');
      expect(proxy.mkdirRequestedDirPaths()).toStrictEqual([imagesDirPath]);
      expect(proxy.writeCallCount()).toBe(0);
    });
  });
});
