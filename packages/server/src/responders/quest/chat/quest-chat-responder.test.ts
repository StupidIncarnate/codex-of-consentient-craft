import {
  AbsoluteFilePathStub,
  GuildIdStub,
  PastedImageUploadStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { QuestChatResponder } from './quest-chat-responder';
import { QuestChatResponderProxy } from './quest-chat-responder.proxy';

describe('QuestChatResponder', () => {
  describe('successful chat resume', () => {
    it('VALID: {questId in params, message in body, chaoswhisperer work item with sessionId} => returns 200 with chatProcessId', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-resume' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-resume' });
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            role: 'chaoswhisperer',
            sessionId,
          }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/abc' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'continue our chat' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-resume' },
      });
    });

    it('VALID: {quest.status === paused} => calls resume adapter once with {questId} BEFORE chat-start, still returns 200', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-paused' });
      const sessionId = SessionIdStub({ value: 'session-paused' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-after-resume' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        workItems: [
          WorkItemStub({
            role: 'chaoswhisperer',
            sessionId,
          }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/paused' }),
      });
      proxy.setupResumeQuest({ questId, resumed: true, restoredStatus: 'in_progress' });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'wake up' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-after-resume' },
      });

      // Resume adapter was called exactly once with { questId }.
      expect(proxy.getResumeQuestCalls()).toStrictEqual([{ questId }]);

      // Resume invocation order strictly precedes start-chat invocation order.
      expect(proxy.assertResumeCalledBeforeStartChat()).toBe(true);
    });
  });

  describe('post-quest chat item exclusion', () => {
    it('VALID: {tavernkeeper item first with sessionId, chaoswhisperer item second with sessionId} => resumes the chaoswhisperer sessionId', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-tavernkeeper-and-chaoswhisperer' });
      const tavernkeeperSessionId = SessionIdStub({ value: 'session-tavernkeeper' });
      const chaoswhispererSessionId = SessionIdStub({ value: 'session-chaoswhisperer' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-chaoswhisperer' });
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId }),
          WorkItemStub({ role: 'chaoswhisperer', sessionId: chaoswhispererSessionId }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/tavernkeeper-and-chaoswhisperer' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'continue the spec chat' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-chaoswhisperer' },
      });

      // The main composer's selector must skip the tavernkeeper item (first in workItems) and
      // resume the chaoswhisperer session it actually owns — a bare first-match selector would
      // pick tavernkeeper's sessionId instead.
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'continue the spec chat',
        sessionId: chaoswhispererSessionId,
      });
    });

    it('VALID: {only chat item carrying a sessionId is tavernkeeper} => starts a fresh chat with no sessionId', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-only-tavernkeeper' });
      const tavernkeeperSessionId = SessionIdStub({ value: 'session-only-tavernkeeper' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-fresh-tavernkeeper' });
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'tavernkeeper', sessionId: tavernkeeperSessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/only-tavernkeeper' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'new spec question' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-fresh-tavernkeeper' },
      });

      // No non-post-quest chat item carries a sessionId, so start-chat gets no sessionId key at
      // all — not an undefined value.
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'new spec question',
      });
    });
  });

  describe('no active chat session', () => {
    it('EDGE: {quest exists but no work item has sessionId} => still delegates to chat-start (no error), returns 200', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-no-session' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-fresh' });
      const quest = QuestStub({
        id: questId,
        workItems: [],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/no-session' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'hello fresh' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-fresh' },
      });

      // Quest is in_progress (default), so resume is NOT called.
      expect(proxy.getResumeQuestCalls()).toStrictEqual([]);
    });
  });

  describe('validation errors', () => {
    it('ERROR: {null params} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({ params: null, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('ERROR: {missing questId} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({ params: {}, body: { message: 'hi' } });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('ERROR: {null body} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('ERROR: {missing message in body} => returns 400', async () => {
      QuestChatResponderProxy();

      const result = await QuestChatResponder({
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
    it('ERROR: {questId not found — load adapter throws} => returns 500 with error message', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });
      proxy.setupQuestLoadError({ questId, error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'hi' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });

    it('ERROR: {start-chat adapter throws during delegation} => returns 500 with error message', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-startchat-throws' });
      const sessionId = SessionIdStub({ value: 'session-throws' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            role: 'chaoswhisperer',
            sessionId,
          }),
        ],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/throws' }),
      });
      proxy.setupStartChatError({ guildId, message: 'orchestrator startChat exploded' });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'hi' },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'orchestrator startChat exploded' },
      });
    });
  });

  describe('pasted images', () => {
    it('VALID: {images: [no key at all], message text only} => persist broker never touches the filesystem, message forwarded unchanged', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-no-images-key' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-no-images-key' });
      const quest = QuestStub({ id: questId, workItems: [] });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/no-images-key' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'plain text only, no images field at all' },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-no-images-key' },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'plain text only, no images field at all',
      });
    });

    it('EDGE: {images: []} => persist broker never touches the filesystem, message forwarded unchanged', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-empty-images-array' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-empty-images-array' });
      const quest = QuestStub({ id: questId, workItems: [] });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/empty-images-array' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'text with an empty images array', images: [] },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-empty-images-array' },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: 'text with an empty images array',
      });
    });

    it('VALID: {images: [two distinct images], message carrying both tokens} => both images reach the write path, in the posted order', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-two-images' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-two-images' });
      const quest = QuestStub({ id: questId, workItems: [] });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/two-images' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });
      proxy.stagePastedImageIds({
        ids: ['22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'],
      });
      const firstImage = PastedImageUploadStub({
        mediaType: 'image/png',
        dataBase64: 'Zmlyc3QtaW1hZ2U=',
      });
      const secondImage = PastedImageUploadStub({
        mediaType: 'image/jpeg',
        dataBase64: 'c2Vjb25kLWltYWdl',
      });

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
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([
        'Zmlyc3QtaW1hZ2U=',
        'c2Vjb25kLWltYWdl',
      ]);
    });

    it(`INVALID: {images: [${pastedImageStatics.maxImagesPerMessage + 1} entries]} => returns 400 naming the images field, writes zero files`, async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-too-many-images' });
      const images = Array.from({ length: pastedImageStatics.maxImagesPerMessage + 1 }, () =>
        PastedImageUploadStub(),
      );

      const result = await proxy.callResponder({
        params: { questId },
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
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-bad-media-type' });
      const allowedMediaTypesList = pastedImageStatics.allowedMediaTypes
        .map((mediaType) => `'${mediaType}'`)
        .join(' | ');

      const result = await proxy.callResponder({
        params: { questId },
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

    it('INVALID: {images: [{dataBase64: decodes over the per-image byte ceiling}]} => returns 400 naming the images field, writes zero files', async () => {
      const proxy = QuestChatResponderProxy();
      const questId = QuestIdStub({ value: 'quest-oversized-image' });
      const overCeilingBase64 = 'A'.repeat(
        Math.ceil(((pastedImageStatics.maxBytesPerImage + 1) * 4) / 3),
      );

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          message: 'a picture that is far too large',
          images: [{ mediaType: 'image/png', dataBase64: overCeilingBase64 }],
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: `Decoded image exceeds ${String(pastedImageStatics.maxBytesPerImage)} bytes`,
        },
      });
      expect(proxy.getWrittenPayloadsInOrder()).toStrictEqual([]);
    });

    it('VALID: {images: [one image], message carrying its token} => startChat is called exactly once, with the message rewritten to the persisted path', async () => {
      const proxy = QuestChatResponderProxy();
      const homePath = '/home/quest-chat-responder-test';
      proxy.setupPastedImageHome({ homePath });
      const imageId = '44444444-4444-4444-8444-444444444444';
      proxy.stagePastedImageIds({ ids: [imageId] });
      const questId = QuestIdStub({ value: 'quest-one-image-rewrite' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-one-image-rewrite' });
      const quest = QuestStub({ id: questId, workItems: [] });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/quests/one-image-rewrite' }),
      });
      proxy.setupStartChat({ guildId, chatProcessId });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      const result = await proxy.callResponder({
        params: { questId },
        body: { message: 'see [Pasted Image 1] please', images: [image] },
      });

      const expectedPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images/${imageId}.png`;

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-one-image-rewrite' },
      });
      expect(proxy.getStartChatCallCount()).toBe(1);
      expect(proxy.getStartChatCallArgs({ guildId })).toStrictEqual({
        guildId,
        message: `see ![Pasted Image 1](${expectedPath}) please`,
      });
    });
  });
});
