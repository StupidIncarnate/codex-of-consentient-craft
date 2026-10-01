import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { PastedImageUploadStub } from '@dungeonmaster/shared/contracts/pasted-image-upload/pasted-image-upload.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { QuestClarifyBodyStub } from '../../../contracts/quest-clarify-body/quest-clarify-body.stub';
import { QuestClarifyResponder } from './quest-clarify-responder';
import { QuestClarifyResponderProxy } from './quest-clarify-responder.proxy';

describe('QuestClarifyResponder', () => {
  describe('successful clarification', () => {
    it('VALID: {questId in params, body with answers/questions, chat work item with sessionId} => returns 200 with chatProcessId', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify' });
      const guildId = GuildIdStub();
      const chatProcessId = 'proc-clarify';
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: '/q/path',
      });
      proxy.setupClarify({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', labels: ['a1'] }],
          questions: [
            {
              question: 'a question',
              header: 'q1',
              options: [{ label: 'a1', description: 'first option' }],
              multiSelect: false,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-clarify' },
      });
    });

    it('VALID: {question-1 answer {header: Letters, labels: [Alpha, Gamma], text: prefer Gamma}} => returns 200 with chatProcessId', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId, questPath: '/q/path' });
      proxy.setupClarify({ questId, chatProcessId: 'proc-multi' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'Letters', labels: ['Alpha', 'Gamma'], text: 'prefer Gamma' }],
          questions: [
            {
              question: 'Which letters?',
              header: 'Letters',
              options: [
                { label: 'Alpha', description: 'first letter' },
                { label: 'Beta', description: 'second letter' },
                { label: 'Gamma', description: 'third letter' },
              ],
              multiSelect: true,
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-multi' },
      });
    });
  });

  describe('pasted images', () => {
    it('VALID: {Shape answer with one png, text "[Pasted Image 1] like this"} => writes the png and hands the orchestrator the rewritten text with no images key', async () => {
      const proxy = QuestClarifyResponderProxy();
      const homePath = '/home/quest-clarify-responder-one-image';
      proxy.setupPastedImageHome({ homePath });
      const imageId = '66666666-6666-4666-8666-666666666666';
      proxy.stagePastedImageIds({ ids: [imageId] });
      const { questions } = QuestClarifyBodyStub();
      const questId = QuestIdStub({ value: 'quest-clarify-one-image' });
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify-one-image' });
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });
      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId, questPath: '/q/one-image', homePath });
      proxy.setupClarify({ questId, chatProcessId: 'proc-one-image' });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [
            { header: 'Shape', labels: [], text: '[Pasted Image 1] like this', images: [image] },
          ],
          questions,
        },
      });

      const expectedPath = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images/${imageId}.png`;

      expect(result).toStrictEqual({ status: 200, data: { chatProcessId: 'proc-one-image' } });
      expect(proxy.getWrittenImagePaths()).toStrictEqual([expectedPath]);
      expect(proxy.getWrittenPayloadFor({ filePath: expectedPath })).toBe('b25lLWltYWdl');
      expect(proxy.getClarifyAnswerCallArgs()).toStrictEqual([
        {
          guildId,
          sessionId,
          questId,
          answers: [
            {
              header: 'Shape',
              labels: [],
              text: `![Pasted Image 1](${expectedPath}) like this`,
            },
          ],
          questions,
        },
      ]);
    });

    it('VALID: {two answers each with one png and a "[Pasted Image 1]" token} => each token points at the file written from that answer own image', async () => {
      const proxy = QuestClarifyResponderProxy();
      const homePath = '/home/quest-clarify-responder-two-answers';
      proxy.setupPastedImageHome({ homePath });
      const firstId = '77777777-7777-4777-8777-777777777777';
      const secondId = '88888888-8888-4888-8888-888888888888';
      proxy.stagePastedImageIds({ ids: [firstId, secondId] });
      const { questions } = QuestClarifyBodyStub();
      const questId = QuestIdStub({ value: 'quest-clarify-two-answers' });
      const guildId = GuildIdStub();
      const sessionId = SessionIdStub({ value: 'session-clarify-two-answers' });
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });
      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({ questId, guildId, questPath: '/q/two-answers', homePath });
      proxy.setupClarify({ questId, chatProcessId: 'proc-two-answers' });
      const firstImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'Zmlyc3Q=' });
      const secondImage = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'c2Vjb25k' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [
            {
              header: 'Shape',
              labels: ['Round'],
              text: 'a [Pasted Image 1]',
              images: [firstImage],
            },
            { header: 'Color', labels: [], text: 'b [Pasted Image 1]', images: [secondImage] },
          ],
          questions,
        },
      });

      const imagesDir = `${homePath}/.dungeonmaster/guilds/${guildId}/quests/${questId}/images`;

      expect(result).toStrictEqual({ status: 200, data: { chatProcessId: 'proc-two-answers' } });
      expect(proxy.getClarifyAnswerCallArgs()).toStrictEqual([
        {
          guildId,
          sessionId,
          questId,
          answers: [
            {
              header: 'Shape',
              labels: ['Round'],
              text: `a ![Pasted Image 1](${imagesDir}/${firstId}.png)`,
            },
            {
              header: 'Color',
              labels: [],
              text: `b ![Pasted Image 1](${imagesDir}/${secondId}.png)`,
            },
          ],
          questions,
        },
      ]);
    });

    it('INVALID: {Shape answer with 6 images} => returns 400 and writes no file', async () => {
      const proxy = QuestClarifyResponderProxy();
      const { questions } = QuestClarifyBodyStub();
      const questId = QuestIdStub({ value: 'quest-clarify-six-images' });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [
            {
              header: 'Shape',
              labels: [],
              text: 'six',
              images: [image, image, image, image, image, image],
            },
          ],
          questions,
        },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: {
          error: `Too big: expected array to have <=${String(pastedImageStatics.maxImagesPerMessage)} items`,
        },
      });
      expect(proxy.getWrittenImagePaths()).toStrictEqual([]);
      expect(proxy.getClarifyAnswerCallArgs()).toStrictEqual([]);
    });

    it('INVALID: {Shape answer with one image/bmp} => returns 400 and writes no file', async () => {
      const proxy = QuestClarifyResponderProxy();
      const { questions } = QuestClarifyBodyStub();
      const questId = QuestIdStub({ value: 'quest-clarify-bmp-image' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [
            {
              header: 'Shape',
              labels: [],
              text: 'bmp',
              images: [{ mediaType: 'image/bmp', dataBase64: 'Ym1w' }],
            },
          ],
          questions,
        },
      });
      const allowedMediaTypesList = pastedImageStatics.allowedMediaTypes
        .map((mediaType) => `"${mediaType}"`)
        .join('|');

      expect(result).toStrictEqual({
        status: 400,
        data: { error: `Invalid option: expected one of ${allowedMediaTypesList}` },
      });
      expect(proxy.getWrittenImagePaths()).toStrictEqual([]);
      expect(proxy.getClarifyAnswerCallArgs()).toStrictEqual([]);
    });

    it('EDGE: {quest with no chat session, answer carrying an image} => returns 404 and writes no file', async () => {
      const proxy = QuestClarifyResponderProxy();
      const { questions } = QuestClarifyBodyStub();
      const questId = QuestIdStub({ value: 'quest-clarify-no-session-image' });
      proxy.setupQuestLoad({ quest: QuestStub({ id: questId, workItems: [] }) });
      const image = PastedImageUploadStub({ mediaType: 'image/png', dataBase64: 'b25lLWltYWdl' });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'Shape', labels: [], text: '[Pasted Image 1]', images: [image] }],
          questions,
        },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'No active chat session found for quest' },
      });
      expect(proxy.getWrittenImagePaths()).toStrictEqual([]);
    });
  });

  describe('not-found cases', () => {
    it('EDGE: {quest with no chat work item sessionId} => returns 404', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      const quest = QuestStub({ id: questId, workItems: [] });

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', labels: ['a1'] }],
          questions: [],
        },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'No active chat session found for quest' },
      });
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: null,
        body: { answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: {},
        body: { answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null body} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('INVALID: {empty answers} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {answer {header: Letters, labels: []} and no text} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [{ header: 'Letters', labels: [] }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {answer {labels: [], text: whitespace only}} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [{ header: 'Letters', labels: [], text: '   ' }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });

    it('INVALID: {answer {labels: [empty string]}} => returns 400', async () => {
      QuestClarifyResponderProxy();

      const result = await QuestClarifyResponder({
        params: { questId: QuestIdStub() },
        body: { answers: [{ header: 'Letters', labels: [''] }], questions: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'answers array is required and must not be empty' },
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {load quest throws} => returns 500', async () => {
      const proxy = QuestClarifyResponderProxy();
      const questId = QuestIdStub();
      proxy.setupQuestLoadError({ questId, error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          answers: [{ header: 'q1', labels: ['a1'] }],
          questions: [],
        },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });
  });
});
