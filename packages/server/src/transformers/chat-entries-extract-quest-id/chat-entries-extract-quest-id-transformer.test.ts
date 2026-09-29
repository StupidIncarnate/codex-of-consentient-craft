import {
  AssistantToolUseChatEntryStub,
  AssistantTextChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts/chat-entry/chat-entry.stub';

import { chatEntriesExtractQuestIdTransformer } from './chat-entries-extract-quest-id-transformer';

describe('chatEntriesExtractQuestIdTransformer', () => {
  it('VALID: {tool_use with questId in input} => returns that questId', () => {
    const entry = AssistantToolUseChatEntryStub({
      toolName: 'mcp__dungeonmaster__modify-quest',
      toolInput: JSON.stringify({ questId: '205d9f78-af8e-7d61-84c8-46f1c26c690d' }),
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [entry] });

    expect(result).toBe('205d9f78-af8e-7d61-84c8-46f1c26c690d');
  });

  it('VALID: {user tool_result content with questId} => returns that questId', () => {
    const entry = UserChatEntryStub({
      content: JSON.stringify({
        questId: '96ed7a48-e073-7b87-8718-aa6a3ee1f9a1',
        extra: 'x',
      }),
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [entry] });

    expect(result).toBe('96ed7a48-e073-7b87-8718-aa6a3ee1f9a1');
  });

  it('VALID: {multiple entries, latest has questId} => returns latest', () => {
    const earlier = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questId: 'c96589ee-fb08-28c0-b179-095bcd0cef5f' }),
    });
    const later = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questId: '81f426e0-1386-5542-a1f6-e46a94b91dd3' }),
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [earlier, later] });

    expect(result).toBe('81f426e0-1386-5542-a1f6-e46a94b91dd3');
  });

  it('VALID: {latest entry has no questId, earlier does} => returns earlier', () => {
    const earlier = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questId: 'ba584060-c8f2-4b59-8ce3-f17766ba76d3' }),
    });
    const later = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questions: [] }),
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [earlier, later] });

    expect(result).toBe('ba584060-c8f2-4b59-8ce3-f17766ba76d3');
  });

  it('EMPTY: {no entries reference questId} => returns undefined', () => {
    const text = AssistantTextChatEntryStub();
    const tool = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questions: [] }),
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [text, tool] });

    expect(result).toBe(undefined);
  });

  it('EMPTY: {entries empty} => returns undefined', () => {
    expect(chatEntriesExtractQuestIdTransformer({ entries: [] })).toBe(undefined);
  });

  it('VALID: {questId nested under outer object} => returns it', () => {
    const entry = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({
        wrapper: { questId: '0e896730-9476-1282-aaf8-3d6cae5c146e' },
      }),
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [entry] });

    expect(result).toBe('0e896730-9476-1282-aaf8-3d6cae5c146e');
  });
});
