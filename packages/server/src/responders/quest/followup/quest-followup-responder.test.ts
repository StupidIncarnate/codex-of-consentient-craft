import {
  GuildIdStub,
  PastedImageUploadStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics, questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { QuestFollowupResponder } from './quest-followup-responder';
import { QuestFollowupResponderProxy } from './quest-followup-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

const FOLLOWUP_ALLOWED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isFollowupChatable,
);

const FOLLOWUP_ALLOWED_SET: ReadonlySet<StatusKey> = new Set(FOLLOWUP_ALLOWED_STATUSES);

const FOLLOWUP_REJECTED_STATUSES: readonly StatusKey[] = STATUSES.filter(
  (status) => !FOLLOWUP_ALLOWED_SET.has(status),
);

const FOLLOWUP_REJECTED_ERROR = 'Quest must be blocked, complete or merged for follow-up';

// zod's own array-too-big message for pastedImageUploadListContract's `.max()` — the numeric ceiling
// is derived from the static so this string tracks a future cap change without edits here.
const IMAGES_TOO_MANY_ERROR = `Array must contain at most ${pastedImageStatics.maxImagesPerMessage} element(s)`;

// zod's own invalid_enum_value message for pastedImageMediaTypeContract — the option list is derived
// from the static so it tracks pastedImageStatics.allowedMediaTypes rather than a hand-copied list.
const DISALLOWED_MEDIA_TYPE = 'image/svg+xml';
const IMAGES_DISALLOWED_MEDIA_TYPE_ERROR = `Invalid enum value. Expected ${pastedImageStatics.allowedMediaTypes
  .map((mediaType) => `'${mediaType}'`)
  .join(' | ')}, received '${DISALLOWED_MEDIA_TYPE}'`;

// zod's own refine message for base64ImageDataContract's byte-ceiling check — the numeric ceiling is
// derived from the static, matching the contract's own `Decoded image exceeds ${bytes} bytes` text.
const IMAGES_OVER_BYTE_CEILING_ERROR = `Decoded image exceeds ${pastedImageStatics.maxBytesPerImage} bytes`;

describe('QuestFollowupResponder', () => {
  describe('successful follow-up chat', () => {
    it('VALID: {complete quest, message in body} => returns 200 with chatProcessId and delegates the exact {questId, guildId, message}', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-complete-followup' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-followup' });
      const quest = QuestStub({ id: questId, status: 'complete' });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'What was blocking this quest?' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-followup' },
      });
      expect(proxy.getStartFollowupChatCalls()).toStrictEqual([
        { questId, guildId, message: 'What was blocking this quest?' },
      ]);
    });

    it('VALID: {merged quest} => returns 200 with chatProcessId', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-merged-followup' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-merged' });
      const quest = QuestStub({ id: questId, status: 'merged' });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'Can you explain what shipped in the merge?' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-merged' },
      });
    });
  });

  describe('status gate', () => {
    // A gate that only proved it ACCEPTS blocked/complete/merged would still pass while also
    // accepting paused/approved/abandoned — so both halves of the matrix are derived from the
    // SAME statics source (see get-testing-patterns "Subset-membership expected values").
    it.each(FOLLOWUP_ALLOWED_STATUSES)(
      'VALID: {status: %s} => returns 200 with chatProcessId',
      async (status) => {
        const proxy = QuestFollowupResponderProxy();
        const questId = QuestIdStub();
        const guildId = GuildIdStub();
        const chatProcessId = ProcessIdStub();
        const quest = QuestStub({ id: questId, status });

        proxy.setupQuestLoad({ quest });
        proxy.setupFindQuestPath({ questId, guildId });
        proxy.setupStartFollowupChat({ questId, chatProcessId });

        const result = await proxy.callResponder({
          params: { questId },
          body: { message: 'Follow-up question' },
        });

        expect(result).toStrictEqual({
          status: 200,
          data: { chatProcessId },
        });
      },
    );

    it.each(FOLLOWUP_REJECTED_STATUSES)(
      'INVALID: {status: %s} => returns 400 and never calls the start-followup-chat adapter',
      async (status) => {
        const proxy = QuestFollowupResponderProxy();
        const questId = QuestIdStub();
        const quest = QuestStub({ id: questId, status });

        proxy.setupQuestLoad({ quest });

        const result = await proxy.callResponder({
          params: { questId },
          body: { message: 'Follow-up question' },
        });

        expect(result).toStrictEqual({
          status: 400,
          data: { error: FOLLOWUP_REJECTED_ERROR },
        });
        expect(proxy.getStartFollowupChatCalls()).toStrictEqual([]);
      },
    );
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({ params: null, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({ params: {}, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null body} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {missing message in body} => returns 400', async () => {
      QuestFollowupResponderProxy();

      const result = await QuestFollowupResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'message is required' },
      });
    });
  });

  describe('orchestrator failures', () => {
    it('ERROR: {start-followup-chat adapter throws worktree-not-found} => returns 500 naming the absolute worktree path', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-missing-worktree' });
      const guildId = GuildIdStub();
      const quest = QuestStub({ id: questId, status: 'blocked' });
      const worktreeNotFoundMessage = `Cannot start chat for quest ${questId}: worktree not found: /home/dm/.dungeonmaster/worktrees/${questId}`;

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChatError({ questId, error: new Error(worktreeNotFoundMessage) });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'Why did this quest block?' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: worktreeNotFoundMessage },
      });
    });
  });

  describe('pasted images', () => {
    it('VALID: {2 distinct pasted images, message with two placeholders} => persists each image to its own file in posted order', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-two-images' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-two-images' });
      const quest = QuestStub({ id: questId, status: 'complete' });
      const homePath = '/home/followup-two-images';
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });
      proxy.setupPastedImageHome({ homePath });
      proxy.stagePastedImageIds({ ids: ['first-image-id', 'second-image-id'] });

      const firstImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });
      const secondImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'd29ybGQ=' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          message: 'first [Pasted Image 1] then [Pasted Image 2]',
          images: [firstImage, secondImage],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-two-images' },
      });
      // The first posted image lands under the FIRST staged id and carries the FIRST payload; the
      // second posted image lands under the SECOND — proving the two entries reached the broker
      // in the order they were posted, not swapped or collapsed into one.
      expect(
        proxy.getPastedImageWrittenPayloadFor({ filePath: `${imagesDirPath}/first-image-id.png` }),
      ).toBe('aGVsbG8=');
      expect(
        proxy.getPastedImageWrittenPayloadFor({ filePath: `${imagesDirPath}/second-image-id.png` }),
      ).toBe('d29ybGQ=');
    });

    it('VALID: {message with one placeholder, one pasted image} => forwards the rewritten message to start-followup-chat exactly once', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-forward-rewritten' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-forward-rewritten' });
      const quest = QuestStub({ id: questId, status: 'blocked' });
      const homePath = '/home/followup-forward';
      const imagesDirPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;
      const expectedPath = `${imagesDirPath}/forwarded-image-id.png`;

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });
      proxy.setupPastedImageHome({ homePath });
      proxy.stagePastedImageIds({ ids: ['forwarded-image-id'] });

      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'aGVsbG8=' });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'Look at [Pasted Image 1] now', images: [image] },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-forward-rewritten' },
      });
      // A single-entry array proves BOTH that start-followup-chat was called exactly once AND
      // that its message argument carries the rewritten `![Pasted Image 1](<path>)` token rather
      // than the bare `[Pasted Image 1]` the browser posted.
      expect(proxy.getStartFollowupChatCalls()).toStrictEqual([
        { questId, guildId, message: `Look at ![Pasted Image 1](${expectedPath}) now` },
      ]);
    });

    it('INVALID: {6 pasted images, one over the per-message cap} => returns 400 and writes zero files', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-too-many-images' });
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'too many images', images },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: IMAGES_TOO_MANY_ERROR },
      });
      expect(proxy.getPastedImageWriteCallCount()).toBe(0);
    });

    it('INVALID: {one image with a disallowed mediaType} => returns 400 naming the images field and writes zero files', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-bad-media-type' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          message: 'bad media type',
          images: [{ mediaType: DISALLOWED_MEDIA_TYPE, dataBase64: 'iVBORw0KGgo=' }],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: IMAGES_DISALLOWED_MEDIA_TYPE_ERROR },
      });
      expect(proxy.getPastedImageWriteCallCount()).toBe(0);
    });

    it('INVALID: {one image whose base64 decodes over the per-image byte ceiling} => returns 400 naming the images field and writes zero files', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-over-byte-ceiling' });
      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          message: 'oversized image',
          images: [{ mediaType: 'image/png', dataBase64: overCeilingBase64 }],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: IMAGES_OVER_BYTE_CEILING_ERROR },
      });
      expect(proxy.getPastedImageWriteCallCount()).toBe(0);
    });

    it('VALID: {body with no images key} => calls the persist broker zero times and forwards the posted message unchanged', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-no-images-key' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-no-images-key' });
      const quest = QuestStub({ id: questId, status: 'complete' });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId });
      proxy.setupStartFollowupChat({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'no images here' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-no-images-key' },
      });
      expect(proxy.getStartFollowupChatCalls()).toStrictEqual([
        { questId, guildId, message: 'no images here' },
      ]);
      expect(proxy.getPastedImageWriteCallCount()).toBe(0);
    });

    it('INVALID: {rejected quest status, images present in body} => returns 400 and writes zero files before ever reaching the broker', async () => {
      const proxy = QuestFollowupResponderProxy();
      const questId = QuestIdStub({ value: 'quest-rejected-with-images' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const image = PastedImageUploadStub();

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'Follow-up question', images: [image] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: FOLLOWUP_REJECTED_ERROR },
      });
      expect(proxy.getPastedImageWriteCallCount()).toBe(0);
      expect(proxy.getStartFollowupChatCalls()).toStrictEqual([]);
    });
  });
});
