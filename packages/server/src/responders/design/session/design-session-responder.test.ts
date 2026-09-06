import {
  GuildIdStub,
  PastedImageUploadStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics, questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { DesignSessionResponderProxy } from './design-session-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const DESIGN_SESSION_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isDesignPhase,
);

const DESIGN_SESSION_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(DESIGN_SESSION_ALLOWED_STATUSES);

const DESIGN_SESSION_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !DESIGN_SESSION_ALLOWED_SET.has(status),
);

const DESIGN_SESSION_REJECTED_ERROR =
  'Quest must be in a design-phase status (explore_design, review_design, or design_approved) to use the design chat';

describe('DesignSessionResponder', () => {
  describe('allowed statuses', () => {
    it.each(DESIGN_SESSION_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with chatProcessId',
      async (status) => {
        const proxy = DesignSessionResponderProxy();
        const questId = QuestIdStub();
        const chatProcessId = ProcessIdStub();
        const quest = QuestStub({ id: questId, status });
        proxy.setupQuest({ quest });
        proxy.setupDesignChat({ questId, chatProcessId });

        const result = await proxy.callResponder({
          params: { questId },
          body: { guildId: GuildIdStub(), message: 'Update the button color' },
        });

        expect(result).toStrictEqual({
          status: 200,
          data: { chatProcessId },
        });
      },
    );
  });

  describe('rejected statuses', () => {
    it.each(DESIGN_SESSION_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 with error',
      async (status) => {
        const proxy = DesignSessionResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ id: questId, status });
        proxy.setupQuest({ quest });

        const result = await proxy.callResponder({
          params: { questId },
          body: { guildId: GuildIdStub(), message: 'Update the button color' },
        });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: DESIGN_SESSION_REJECTED_ERROR },
        });
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({ params: null, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({ params: {}, body: {} });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {missing guildId} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {missing message} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub() },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });

    it('INVALID: {empty message} => returns 400', async () => {
      const proxy = DesignSessionResponderProxy();

      const result = await proxy.callResponder({
        params: { questId: QuestIdStub() },
        body: { guildId: GuildIdStub(), message: '' },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter throws} => returns 500', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({ id: questId, status: 'explore_design' });
      proxy.setupQuest({ quest });
      proxy.setupDesignChatError({ questId, error: new Error('Design chat failed') });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId: GuildIdStub(), message: 'Update button' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Design chat failed' },
      });
    });
  });

  describe('pasted images', () => {
    it('VALID: {no images key in body} => calls the persist broker zero times and forwards the posted message unchanged', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub();
      const quest = QuestStub({ id: questId, status: 'explore_design' });
      proxy.setupQuest({ quest });
      proxy.setupDesignChat({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId, message: 'Update the button color' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId },
      });
      expect(proxy.persistedImageWriteCallCount()).toBe(0);
      expect(proxy.getStartDesignChatCalls()).toStrictEqual([
        { questId, guildId, message: 'Update the button color' },
      ]);
    });

    it('VALID: {images: [two distinct images]} => the responder parses exactly 2 entries and persists them in the posted order', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub();
      const quest = QuestStub({ id: questId, status: 'explore_design' });
      const homePath = '/home/design-two-images';
      const firstId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
      const secondId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
      proxy.setupQuest({ quest });
      proxy.setupDesignChat({ questId, chatProcessId });
      proxy.setupImagePersistHome({ homePath });
      proxy.stagePersistedImageIds({ ids: [firstId, secondId] });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          guildId,
          message: 'first [Pasted Image 1] second [Pasted Image 2]',
          images: [
            PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' }),
            PastedImageUploadStub({ mediaType: 'image/jpeg', dataBase64: 'd29ybGQ=' }),
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId },
      });

      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const firstPath = `${imagesDirPath}/${firstId}.png`;
      const secondPath = `${imagesDirPath}/${secondId}.jpeg`;

      expect(proxy.getStartDesignChatCalls()).toStrictEqual([
        {
          questId,
          guildId,
          message: `first ![Pasted Image 1](${firstPath}) second ![Pasted Image 2](${secondPath})`,
        },
      ]);
    });

    it('VALID: {images: [one image]} => calls startDesignChat exactly once, with the rewritten message rather than the one the browser posted', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub();
      const quest = QuestStub({ id: questId, status: 'explore_design' });
      const homePath = '/home/design-forward-once';
      const imageId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
      proxy.setupQuest({ quest });
      proxy.setupDesignChat({ questId, chatProcessId });
      proxy.setupImagePersistHome({ homePath });
      proxy.stagePersistedImageIds({ ids: [imageId] });

      await proxy.callResponder({
        params: { questId },
        body: {
          guildId,
          message: 'look at this [Pasted Image 1]',
          images: [PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' })],
        },
      });

      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const expectedPath = `${imagesDirPath}/${imageId}.png`;

      expect(proxy.getStartDesignChatCalls()).toStrictEqual([
        { questId, guildId, message: `look at this ![Pasted Image 1](${expectedPath})` },
      ]);
    });

    it('INVALID: {images: maxImagesPerMessage + 1} => returns 400 naming the images field and writes zero files', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      proxy.setupImagePersistHome({ homePath: '/home/design-over-cap' });
      const overCapImages = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      const result = await proxy.callResponder({
        params: { questId },
        body: { guildId, message: 'too many images', images: overCapImages },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: `Array must contain at most ${String(pastedImageStatics.maxImagesPerMessage)} element(s)`,
        },
      });
      expect(proxy.persistedImageWriteCallCount()).toBe(0);
    });

    it('INVALID: {images: [entry with disallowed mediaType]} => returns 400 naming the images field and writes zero files', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      proxy.setupImagePersistHome({ homePath: '/home/design-bad-media-type' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          guildId,
          message: 'bad media type',
          images: [{ mediaType: 'image/svg+xml', dataBase64: 'iVBORw0KGgo=' }] as never,
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error:
            "Invalid enum value. Expected 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', received 'image/svg+xml'",
        },
      });
      expect(proxy.persistedImageWriteCallCount()).toBe(0);
    });

    it('INVALID: {images: [entry whose base64 decodes over the byte ceiling]} => returns 400 naming the images field and writes zero files', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      proxy.setupImagePersistHome({ homePath: '/home/design-over-byte-ceiling' });
      const overCeiling = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          guildId,
          message: 'oversized image',
          images: [{ mediaType: 'image/png', dataBase64: overCeiling }] as never,
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
        },
      });
      expect(proxy.persistedImageWriteCallCount()).toBe(0);
    });

    it('INVALID: {missing guildId, images: maxImagesPerMessage + 1} => returns 400 with the guildId text, pinning which arm wins', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const overCapImages = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'too many images and no guild', images: overCapImages },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'guildId is required' },
      });
    });

    it('INVALID: {quest not in a design-phase status, images present} => returns 400 and writes zero files before the broker runs', async () => {
      const proxy = DesignSessionResponderProxy();
      const questId = QuestIdStub();
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      proxy.setupQuest({ quest });
      proxy.setupImagePersistHome({ homePath: '/home/design-rejected-status' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          guildId,
          message: 'Update the button color [Pasted Image 1]',
          images: [PastedImageUploadStub()],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: DESIGN_SESSION_REJECTED_ERROR },
      });
      expect(proxy.persistedImageWriteCallCount()).toBe(0);
    });
  });
});
