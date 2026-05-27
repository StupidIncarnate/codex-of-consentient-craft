import {
  AssistantToolUseChatEntryStub,
  AssistantTextChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { chatEntriesExtractQuestIdTransformer } from './chat-entries-extract-quest-id-transformer';

describe('chatEntriesExtractQuestIdTransformer', () => {
  it('VALID: {tool_use with questId in input} => returns that questId', () => {
    const entry = AssistantToolUseChatEntryStub({
      toolName: 'mcp__dungeonmaster__modify-quest' as never,
      toolInput: JSON.stringify({ questId: 'aabbccdd-eeff-0011-2233-445566778899' }) as never,
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [entry] });

    expect(result).toBe('aabbccdd-eeff-0011-2233-445566778899');
  });

  it('VALID: {user tool_result content with questId} => returns that questId', () => {
    const entry = UserChatEntryStub({
      content: JSON.stringify({
        questId: '11112222-3333-4444-5555-666677778888',
        extra: 'x',
      }) as never,
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [entry] });

    expect(result).toBe('11112222-3333-4444-5555-666677778888');
  });

  it('VALID: {multiple entries, latest has questId} => returns latest', () => {
    const earlier = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questId: '00000000-0000-0000-0000-000000000001' }) as never,
    });
    const later = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questId: '00000000-0000-0000-0000-000000000002' }) as never,
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [earlier, later] });

    expect(result).toBe('00000000-0000-0000-0000-000000000002');
  });

  it('VALID: {latest entry has no questId, earlier does} => returns earlier', () => {
    const earlier = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questId: '00000000-0000-0000-0000-000000000003' }) as never,
    });
    const later = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questions: [] }) as never,
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [earlier, later] });

    expect(result).toBe('00000000-0000-0000-0000-000000000003');
  });

  it('EMPTY: {no entries reference questId} => returns undefined', () => {
    const text = AssistantTextChatEntryStub();
    const tool = AssistantToolUseChatEntryStub({
      toolInput: JSON.stringify({ questions: [] }) as never,
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
        wrapper: { questId: 'deadbeef-cafe-babe-face-feedfacefeed' },
      }) as never,
    });

    const result = chatEntriesExtractQuestIdTransformer({ entries: [entry] });

    expect(result).toBe('deadbeef-cafe-babe-face-feedfacefeed');
  });
});
