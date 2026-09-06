import {
  GuildIdStub,
  PastedImageUploadStub,
  ProcessIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';
import { QuestNewResponder } from './quest-new-responder';
import { QuestNewResponderProxy } from './quest-new-responder.proxy';

describe('QuestNewResponder', () => {
  describe('successful new quest', () => {
    it('VALID: {guildId in params, message in body, adapter returns questId} => returns 200 with questId and chatProcessId', async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-new-quest' });
      const questId = QuestIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupQuestNew({ guildId, chatProcessId, questId });

      const result = await proxy.callResponder({
        params: { guildId },
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
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-no-quest' });

      proxy.setupQuestNew({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-no-quest' },
      });
    });
  });

  describe('quest type', () => {
    it('VALID: {body.questType: "bug-hunt"} => forwards questType to startChat', async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-bug-hunt' });

      proxy.setupQuestNew({ guildId, chatProcessId });

      await proxy.callResponder({
        params: { guildId },
        body: { message: 'Rows do not render', questType: 'bug-hunt' },
      });

      expect(proxy.getLastStartChatArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'Rows do not render',
        questType: 'bug-hunt',
      });
    });

    it('VALID: {body without questType} => omits questType so the orchestrator applies its feature default', async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-default' });

      proxy.setupQuestNew({ guildId, chatProcessId });

      await proxy.callResponder({
        params: { guildId },
        body: { message: 'Add auth' },
      });

      expect(proxy.getLastStartChatArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'Add auth',
      });
    });

    it('INVALID: {body.questType: "bogus"} => returns 400 with error', async () => {
      QuestNewResponderProxy();

      const result = await QuestNewResponder({
        params: { guildId: GuildIdStub() },
        body: { message: 'Add auth', questType: 'bogus' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
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
      const guildId = GuildIdStub();
      proxy.setupError({ guildId, message: 'Guild not found' });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'hello' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
    });
  });

  describe('pasted images', () => {
    it('VALID: {no images key at all, message text only} => persist broker never touches the filesystem, message forwarded unchanged, no questId minted', async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-no-images-key' });

      proxy.setupQuestNew({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'plain text only, no images field at all' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-no-images-key' },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
      expect(proxy.getLastStartChatArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'plain text only, no images field at all',
      });
    });

    it('EDGE: {images: []} => persist broker never touches the filesystem, message forwarded unchanged, no questId minted', async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-empty-images-array' });

      proxy.setupQuestNew({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'text with an empty images array', images: [] },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-empty-images-array' },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
      expect(proxy.getLastStartChatArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'text with an empty images array',
      });
    });

    it('VALID: {images: [one image], message carrying its token} => mints a questId, writes the file under it, rewrites the message, and forwards both to startChat', async () => {
      const proxy = QuestNewResponderProxy();
      const homePath = '/home/quest-new-responder-test';
      proxy.setupPastedImageHome({ homePath });
      const questId = QuestIdStub({ value: '11111111-1111-4111-8111-111111111111' });
      proxy.setupMintedQuestId({ questId });
      const imageId = '44444444-4444-4444-8444-444444444444';
      proxy.stagePastedImageIds({ ids: [imageId] });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-one-image-rewrite' });
      proxy.setupQuestNew({ guildId, chatProcessId, questId });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'see [Pasted Image 1] please', images: [image] },
      });

      const expectedPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images/${imageId}.png`;

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-one-image-rewrite', questId },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual(['b25lLWltYWdl']);
      expect(proxy.getLastStartChatArgs({ guildId })).toStrictEqual({
        guildId,
        mintedQuestId: questId,
        message: `see ![Pasted Image 1](${expectedPath}) please`,
      });
    });

    it('ERROR: {images: [one image], orchestratorStartChatAdapter rejects} => removes the minted quest folder and still returns 500 with the original error', async () => {
      const proxy = QuestNewResponderProxy();
      const homePath = '/home/quest-new-responder-cleanup-test';
      proxy.setupPastedImageHome({ homePath });
      const questId = QuestIdStub({ value: '22222222-2222-4222-8222-222222222222' });
      proxy.setupMintedQuestId({ questId });
      const imageId = '55555555-5555-4555-8555-555555555555';
      proxy.stagePastedImageIds({ ids: [imageId] });
      const guildId = GuildIdStub();
      proxy.setupError({ guildId, message: 'Guild not found' });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'dHdvLWltYWdl' });

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'see [Pasted Image 1] please', images: [image] },
      });

      const expectedQuestFolderPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}`;

      // Turns red if the create failure gets swallowed or replaced by a cleanup-path error
      // instead of rethrown verbatim (e.g. status flips to 200, or the error text changes).
      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Guild not found' },
      });
      // Turns red if the folder is never removed (getRemovedFolderCallsInOrder() => []), if the
      // wrong path is targeted (e.g. the images subfolder instead of the quest folder itself), or
      // if recursive/force is dropped so a non-empty folder would be left behind.
      expect(proxy.getRemovedFolderCallsInOrder()).toStrictEqual([
        [expectedQuestFolderPath, { recursive: true, force: true }],
      ]);
    });

    it(`INVALID: {images: [${pastedImageStatics.maxImagesPerMessage + 1} entries]} => returns 400 naming the images field, writes zero files`, async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      const result = await proxy.callResponder({
        params: { guildId },
        body: { message: 'far too many pictures', images },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: `Array must contain at most ${String(pastedImageStatics.maxImagesPerMessage)} element(s)`,
        },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
    });

    it('INVALID: {images: [{mediaType: disallowed}]} => returns 400 naming the images field, writes zero files', async () => {
      const proxy = QuestNewResponderProxy();
      const guildId = GuildIdStub();
      const allowedMediaTypesList = pastedImageStatics.allowedMediaTypes
        .map((mediaType) => `'${mediaType}'`)
        .join(' | ');

      const result = await proxy.callResponder({
        params: { guildId },
        body: {
          message: 'a picture in the wrong format',
          images: [{ mediaType: 'image/svg+xml', dataBase64: 'iVBORw0KGgo=' }],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: `Invalid enum value. Expected ${allowedMediaTypesList}, received 'image/svg+xml'`,
        },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
    });
  });
});
