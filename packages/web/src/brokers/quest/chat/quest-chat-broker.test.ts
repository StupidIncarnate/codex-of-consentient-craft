import {
  PastedImageUploadStub,
  ProcessIdStub,
  QuestIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { questChatBroker } from './quest-chat-broker';
import { questChatBrokerProxy } from './quest-chat-broker.proxy';

describe('questChatBroker', () => {
  describe('successful chat', () => {
    it('VALID: {questId, message} => returns chatProcessId', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-chat-1' });
      const message = UserInputStub({ value: 'Continue' });
      const chatProcessId = ProcessIdStub({ value: 'proc-chat-1' });

      proxy.setupChat({ chatProcessId });

      const result = await questChatBroker({ questId, message });

      expect(result).toStrictEqual({ chatProcessId: 'proc-chat-1' });
    });
  });

  describe('request count', () => {
    it('VALID: {questId, message} => sends exactly one POST', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-chat-2' });
      const message = UserInputStub({ value: 'Continue' });
      const chatProcessId = ProcessIdStub({ value: 'proc-chat-2' });

      proxy.setupChat({ chatProcessId });

      await questChatBroker({ questId, message });

      expect(proxy.getRequestCount()).toBe(1);
    });
  });

  describe('response parsing', () => {
    it('INVALID: {chatProcessId: empty string} => throws naming the missing field', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      proxy.setupInvalidResponse({ chatProcessId: '' });

      await expect(
        questChatBroker({ questId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(/^POST \/api\/quests\/quest-1\/chat returned 200 with no chatProcessId$/u);
    });

    it('INVALID: {chatProcessId: number} => throws naming the missing field', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      proxy.setupInvalidResponse({ chatProcessId: 12345 });

      await expect(
        questChatBroker({ questId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(/^POST \/api\/quests\/quest-1\/chat returned 200 with no chatProcessId$/u);
    });
  });

  describe('error handling', () => {
    it('ERROR: {network error} => rejects naming the url', async () => {
      const proxy = questChatBrokerProxy();
      proxy.setupError();

      await expect(
        questChatBroker({
          questId: QuestIdStub({ value: 'quest-1' }),
          message: UserInputStub({ value: 'Hi' }),
        }),
      ).rejects.toThrow(/network error posting to/u);
    });
  });

  describe('rejection', () => {
    it('ERROR: {400 with server error body} => throws the exact server error text', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      proxy.setupRejected({ status: 400, error: 'Quest is not accepting messages right now' });

      await expect(
        questChatBroker({ questId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(/^Quest is not accepting messages right now$/u);
    });

    it('EDGE: {400 with an empty error string} => throws a generic status message', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-1' });
      proxy.setupRejected({ status: 400, error: '' });

      await expect(
        questChatBroker({ questId, message: UserInputStub({ value: 'Hi' }) }),
      ).rejects.toThrow(/^POST \/api\/quests\/quest-1\/chat failed with status 400$/u);
    });
  });

  describe('image attachments', () => {
    it('VALID: #check-chat-post-carries-images {message with two placeholders, two images} => POST body carries the tokenised message and both images in order', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-images-1' });
      const message = UserInputStub({ value: 'A[Pasted Image 1]B[Pasted Image 2]C' });
      const chatProcessId = ProcessIdStub({ value: 'proc-images-1' });
      const imageOne = PastedImageUploadStub({ mediaType: 'image/png' });
      const imageTwo = PastedImageUploadStub({ mediaType: 'image/jpeg' });

      proxy.setupChat({ chatProcessId });

      await questChatBroker({ questId, message, images: [imageOne, imageTwo] });

      expect(proxy.getRequestBody()).toStrictEqual({
        message: 'A[Pasted Image 1]B[Pasted Image 2]C',
        images: [imageOne, imageTwo],
      });
      expect(proxy.getRequestUrl()).toBe('/api/quests/quest-images-1/chat');
    });
  });

  describe('text-only send', () => {
    it('EMPTY: #check-text-only-body-has-no-images-key {no images argument} => POSTs body { message } with no images key', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-text-only-1' });
      const message = UserInputStub({ value: 'Just words' });
      const chatProcessId = ProcessIdStub({ value: 'proc-text-only-1' });

      proxy.setupChat({ chatProcessId });

      await questChatBroker({ questId, message });

      expect(proxy.getRequestBody()).toStrictEqual({ message: 'Just words' });
    });

    it('EMPTY: #check-text-only-body-has-no-images-key {images: []} => POSTs body { message } with no images key', async () => {
      const proxy = questChatBrokerProxy();
      const questId = QuestIdStub({ value: 'quest-text-only-2' });
      const message = UserInputStub({ value: 'Still just words' });
      const chatProcessId = ProcessIdStub({ value: 'proc-text-only-2' });

      proxy.setupChat({ chatProcessId });

      await questChatBroker({ questId, message, images: [] });

      expect(proxy.getRequestBody()).toStrictEqual({ message: 'Still just words' });
    });
  });
});
