import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import {
  GuildIdStub,
  QuestIdStub,
  PastedImageUploadStub,
  AbsoluteFilePathStub,
} from '@dungeonmaster/shared/contracts';

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

  describe('unreadable-file-left-alone', () => {
    it('ERROR: {images: [], message with a path whose source read rejects with EACCES} => the message is forwarded unchanged and the send still resolves', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      proxy.stageCopyIds({ ids: ['facefeed-0000-4000-8000-000000000000'] });
      proxy.sourceReadFails({
        filePath: AbsoluteFilePathStub({ value: '/tmp/snip.png' }),
        error: new Error('EACCES: permission denied'),
      });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'see /tmp/snip.png ok',
        images: [],
      });

      expect(result).toBe('see /tmp/snip.png ok');
    });
  });

  describe('over-cap-path-writes-nothing', () => {
    it('EDGE: {five bitmap uploads plus one screenshot path} => only the five upload destinations are written, the sixth path never reaches disk', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const uploadIds = Array.from(
        { length: pastedImageStatics.maxImagesPerMessage },
        (_unused, index) => `aaaaaaaa-0000-4000-8000-${String(index).padStart(12, '0')}`,
      );
      proxy.stageImageIds({ ids: uploadIds });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });
      const images = uploadIds.map(() => image);
      const placeholders = uploadIds
        .map((_unused, index) => `[Pasted Image ${index + 1}]`)
        .join(' ');

      await pastedImagePersistBroker({
        guildId,
        questId,
        message: `${placeholders} see /tmp/snip.png ok`,
        images,
      });

      const expectedPaths = uploadIds.map((id) => `${imagesDirPath}/${id}.png`);

      expect(proxy.writtenImagePaths()).toStrictEqual(expectedPaths);
    });
  });

  describe('failed-copy-keeps-the-send', () => {
    it('ERROR: {images: [], message with a path whose source read resolves but whose destination write rejects} => the message is forwarded unchanged and the send still resolves', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const copyId = 'bbbbbbbb-0000-4000-8000-000000000000';
      proxy.stageCopyIds({ ids: [copyId] });
      proxy.sourceReads({
        filePath: AbsoluteFilePathStub({ value: '/tmp/snip.png' }),
        bytes: new Uint8Array([1, 2, 3]),
      });
      proxy.destinationWriteFails({
        filePath: AbsoluteFilePathStub({ value: `${imagesDirPath}/${copyId}.png` }),
        error: new Error('EACCES: permission denied'),
      });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'see /tmp/snip.png ok',
        images: [],
      });

      expect(result).toBe('see /tmp/snip.png ok');
    });
  });

  describe('cap-applies-across-both-kinds', () => {
    it('EDGE: {five bitmap uploads plus one screenshot path} => the bitmaps convert to tokens and the screenshot path is left as text', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const uploadIds = Array.from(
        { length: pastedImageStatics.maxImagesPerMessage },
        (_unused, index) => `cccccccc-0000-4000-8000-${String(index).padStart(12, '0')}`,
      );
      proxy.stageImageIds({ ids: uploadIds });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });
      const images = uploadIds.map(() => image);
      const placeholders = uploadIds
        .map((_unused, index) => `[Pasted Image ${index + 1}]`)
        .join(' ');

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: `${placeholders} see /tmp/snip.png ok`,
        images,
      });

      const expectedTokens = uploadIds
        .map((id, index) => `![Pasted Image ${index + 1}](${imagesDirPath}/${id}.png)`)
        .join(' ');

      expect(result).toBe(`${expectedTokens} see /tmp/snip.png ok`);
    });
  });

  describe('ordinal-continues-after-bitmaps', () => {
    it('VALID: {two bitmap uploads plus one screenshot path} => the screenshot becomes Pasted Image 3', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const firstId = 'dddddddd-0000-4000-8000-000000000001';
      const secondId = 'dddddddd-0000-4000-8000-000000000002';
      const copyId = 'dddddddd-0000-4000-8000-000000000003';
      proxy.stageImageIds({ ids: [firstId, secondId] });
      proxy.stageCopyIds({ ids: [copyId] });
      proxy.sourceReads({
        filePath: AbsoluteFilePathStub({ value: '/tmp/snip.png' }),
        bytes: new Uint8Array([9, 9, 9]),
      });
      const firstImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });
      const secondImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'd29ybGQ=' });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: '[Pasted Image 1] [Pasted Image 2] see /tmp/snip.png ok',
        images: [firstImage, secondImage],
      });

      const firstPath = `${imagesDirPath}/${firstId}.png`;
      const secondPath = `${imagesDirPath}/${secondId}.png`;
      const copiedPath = `${imagesDirPath}/${copyId}.png`;

      expect(result).toBe(
        `![Pasted Image 1](${firstPath}) ![Pasted Image 2](${secondPath}) see ![Pasted Image 3](${copiedPath}) ok`,
      );
    });
  });

  describe('forward-unchanged', () => {
    it('EMPTY: {images: [], message with no absolute image path} => the message is forwarded unchanged and mkdir is never called', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'no images here',
        images: [],
      });

      expect(result).toBe('no images here');
      expect(proxy.mkdirRequestedDirPaths()).toStrictEqual([]);
    });
  });

  describe('leave-path-as-text', () => {
    it('ERROR: {images: [], one path whose source read rejects} => nothing is written and the path stays in the text', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      proxy.stageCopyIds({ ids: ['deadbeef-0000-4000-8000-000000000000'] });
      proxy.sourceReadFails({
        filePath: AbsoluteFilePathStub({ value: '/tmp/snip.png' }),
        error: new Error('ENOENT: no such file or directory'),
      });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'see /tmp/snip.png ok',
        images: [],
      });

      expect(proxy.writtenImagePaths()).toStrictEqual([]);
      expect(result).toBe('see /tmp/snip.png ok');
    });
  });

  describe('found-none', () => {
    it('EMPTY: {images: [], message holding only a relative path} => the message is forwarded unchanged and mkdir is never called', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });

      const result = await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'see ./shot.png ok',
        images: [],
      });

      expect(proxy.mkdirRequestedDirPaths()).toStrictEqual([]);
      expect(result).toBe('see ./shot.png ok');
    });
  });

  describe('found-some', () => {
    it('VALID: {images: [], one absolute path, source read resolves} => the read is attempted on exactly that path', async () => {
      const proxy = pastedImagePersistBrokerProxy();
      const homePath = '/home/test-guild-home';
      proxy.setupHome({ homePath });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'inline-images' });
      proxy.stageCopyIds({ ids: ['eeeeeeee-0000-4000-8000-000000000000'] });
      proxy.sourceReads({
        filePath: AbsoluteFilePathStub({ value: '/tmp/snip.png' }),
        bytes: new Uint8Array([4, 5, 6]),
      });

      await pastedImagePersistBroker({
        guildId,
        questId,
        message: 'see /tmp/snip.png ok',
        images: [],
      });

      expect(proxy.sourceReadAttemptedPaths()).toStrictEqual(['/tmp/snip.png']);
    });
  });
});
