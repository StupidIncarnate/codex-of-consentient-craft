import { PastedImageUploadStub, QuestIdStub, UserInputStub } from '@dungeonmaster/shared/contracts';

import { questFollowupBroker } from './quest-followup-broker';
import { questFollowupBrokerProxy } from './quest-followup-broker.proxy';

describe('questFollowupBroker', () => {
  describe('request body shape', () => {
    it('VALID: #followup-post-fired {questId, message} => posts body with exactly the typed message', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'What is the status of this quest?' });

      proxy.setupFollowup({ chatProcessId: 'proc-followup-1' });

      await questFollowupBroker({ questId, message });

      expect(proxy.getRequestBody()).toStrictEqual({
        message: 'What is the status of this quest?',
      });
    });

    it('VALID: #check-followup-post-carries-images {message with two pasted-image tokens, two images} => posts the message plus both images in order at the followup route', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'See [Pasted Image 1] and [Pasted Image 2]' });
      const firstImage = PastedImageUploadStub({
        mediaType: 'image/png',
        dataBase64: 'aGVsbG8=',
      });
      const secondImage = PastedImageUploadStub({
        mediaType: 'image/jpeg',
        dataBase64: 'd29ybGQ=',
      });

      proxy.setupFollowup({ chatProcessId: 'proc-followup-images' });

      await questFollowupBroker({ questId, message, images: [firstImage, secondImage] });

      expect(proxy.getRequestBody()).toStrictEqual({
        message: 'See [Pasted Image 1] and [Pasted Image 2]',
        images: [
          { mediaType: 'image/png', dataBase64: 'aGVsbG8=' },
          { mediaType: 'image/jpeg', dataBase64: 'd29ybGQ=' },
        ],
      });
      expect(proxy.getRequestUrl()).toBe('/api/quests/add-auth/followup');
    });

    it('VALID: {text-only follow-up, no images passed} => posts body with no images key', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Are we still on track?' });

      proxy.setupFollowup({ chatProcessId: 'proc-followup-text-only' });

      await questFollowupBroker({ questId, message });

      expect(proxy.getRequestBody()).toStrictEqual({ message: 'Are we still on track?' });
    });
  });

  describe('200 success', () => {
    it('VALID: {200 with chatProcessId} => returns chatProcessId', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Continue' });

      proxy.setupFollowup({ chatProcessId: 'proc-followup-1' });

      const result = await questFollowupBroker({ questId, message });

      expect(result).toStrictEqual({ chatProcessId: 'proc-followup-1' });
    });

    it('EDGE: {200 without chatProcessId} => throws naming the missing field', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Continue' });

      proxy.setupFollowupWithoutChatProcessId();

      await expect(questFollowupBroker({ questId, message })).rejects.toThrow(
        /POST \/api\/quests\/add-auth\/followup returned 200 with no chatProcessId/u,
      );
    });
  });

  describe('400 rejection', () => {
    it('ERROR: #followup-rejection-shown-in-tab {400 with server error body} => throws the exact server error text', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Are we done?' });

      proxy.setupRejected({
        error: 'Quest must be blocked, complete or merged for follow-up',
      });

      await expect(questFollowupBroker({ questId, message })).rejects.toThrow(
        /^Quest must be blocked, complete or merged for follow-up$/u,
      );
    });

    it('EDGE: {400 with no body} => throws a generic status message', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Are we done?' });

      proxy.setupRejectedNoBody();

      await expect(questFollowupBroker({ questId, message })).rejects.toThrow(
        /^POST \/api\/quests\/add-auth\/followup failed with status 400$/u,
      );
    });
  });

  describe('network failure', () => {
    it('ERROR: {network failure before any response} => rejects', async () => {
      const proxy = questFollowupBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const message = UserInputStub({ value: 'Are we done?' });

      proxy.setupError();

      await expect(questFollowupBroker({ questId, message })).rejects.toThrow(
        /network error posting to \/api\/quests\/add-auth\/followup/u,
      );
    });
  });
});
