import { streamJsonResultContract } from './stream-json-result-contract';
import { StreamJsonResultStub } from './stream-json-result.stub';
import { AssistantTextChatEntryStub } from '../chat-entry/chat-entry.stub';

describe('streamJsonResultContract', () => {
  describe('valid results', () => {
    it('VALID: {entries: [], sessionId: null} => parses empty result', () => {
      const result = StreamJsonResultStub();

      const parsed = streamJsonResultContract.parse(result);

      expect(parsed).toStrictEqual({
        entries: [],
        sessionId: null,
      });
    });

    it('VALID: {entries: [chatEntry], sessionId: "abc-123"} => parses with entries and session', () => {
      const entry = AssistantTextChatEntryStub();
      const result = StreamJsonResultStub({
        entries: [entry],
        sessionId: 'abc-123' as never,
      });

      const parsed = streamJsonResultContract.parse(result);

      expect(parsed).toStrictEqual({
        entries: [
          {
            role: 'assistant',
            type: 'text',
            content: 'Hello from assistant',
          },
        ],
        sessionId: 'abc-123',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_ENTRIES: {entries: "not-array"} => throws validation error', () => {
      expect(() => {
        streamJsonResultContract.parse({ entries: 'not-array', sessionId: null });
      }).toThrow(/Expected array/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        streamJsonResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
