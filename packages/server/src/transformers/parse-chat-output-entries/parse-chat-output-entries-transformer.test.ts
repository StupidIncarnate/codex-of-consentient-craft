import { AssistantTextChatEntryStub } from '@dungeonmaster/shared/contracts';

import { parseChatOutputEntriesTransformer } from './parse-chat-output-entries-transformer';
import { parseChatOutputEntriesTransformerProxy } from './parse-chat-output-entries-transformer.proxy';

const makePayload = (entries: unknown): Record<PropertyKey, unknown> => {
  if (entries === undefined) {
    return {};
  }
  return { entries };
};

describe('parseChatOutputEntriesTransformer', () => {
  it('VALID: {payload.entries: [validEntry]} => returns parsed entries', () => {
    parseChatOutputEntriesTransformerProxy();
    const entry = AssistantTextChatEntryStub({ content: 'hello' });
    const payload = makePayload([entry]);

    const result = parseChatOutputEntriesTransformer({ payload });

    expect(result).toStrictEqual([entry]);
  });

  it('EMPTY: {payload.entries undefined} => returns []', () => {
    parseChatOutputEntriesTransformerProxy();
    const payload = makePayload(undefined);

    const result = parseChatOutputEntriesTransformer({ payload });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {payload.entries not an array} => returns []', () => {
    parseChatOutputEntriesTransformerProxy();
    const payload = makePayload('not-an-array');

    const result = parseChatOutputEntriesTransformer({ payload });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {mix of valid + malformed entries} => returns only the valid ones', () => {
    parseChatOutputEntriesTransformerProxy();
    const entry = AssistantTextChatEntryStub({ content: 'good' });
    const payload = makePayload([entry, { role: 'nonsense' }]);

    const result = parseChatOutputEntriesTransformer({ payload });

    expect(result).toStrictEqual([entry]);
  });
});
