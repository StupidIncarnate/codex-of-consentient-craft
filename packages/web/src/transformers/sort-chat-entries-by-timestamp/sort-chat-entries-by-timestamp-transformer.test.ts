import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { sortChatEntriesByTimestampTransformer } from './sort-chat-entries-by-timestamp-transformer';

const TS_EARLY = '2026-01-01T00:00:00.000Z';
const TS_MID = '2026-01-02T00:00:00.000Z';
const TS_LATE = '2026-01-03T00:00:00.000Z';
const UUID_A = '00000000-0000-4000-8000-00000000000a';
const UUID_B = '00000000-0000-4000-8000-00000000000b';
const UUID_C = '00000000-0000-4000-8000-00000000000c';

describe('sortChatEntriesByTimestampTransformer', () => {
  it('VALID: {entries arriving out of timestamp order} => returns entries sorted ascending by timestamp', () => {
    const late = AssistantTextChatEntryStub({ uuid: UUID_C, timestamp: TS_LATE } as never);
    const early = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const mid = AssistantTextChatEntryStub({ uuid: UUID_B, timestamp: TS_MID } as never);

    const result = sortChatEntriesByTimestampTransformer({ entries: [late, early, mid] });

    expect(result).toStrictEqual([early, mid, late]);
  });

  it('VALID: {entries with identical timestamps} => ties broken by uuid lexicographic order', () => {
    const a = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const b = AssistantTextChatEntryStub({ uuid: UUID_B, timestamp: TS_EARLY } as never);
    const c = AssistantTextChatEntryStub({ uuid: UUID_C, timestamp: TS_EARLY } as never);

    const result = sortChatEntriesByTimestampTransformer({ entries: [c, a, b] });

    expect(result).toStrictEqual([a, b, c]);
  });

  it('VALID: {empty entries array} => returns empty array', () => {
    const result = sortChatEntriesByTimestampTransformer({ entries: [] });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {single entry} => returns array with that entry', () => {
    const entry = UserChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);

    const result = sortChatEntriesByTimestampTransformer({ entries: [entry] });

    expect(result).toStrictEqual([entry]);
  });

  it('VALID: {mixed-variant entries out of order} => sorts across types by timestamp', () => {
    const lateText = AssistantTextChatEntryStub({ uuid: UUID_C, timestamp: TS_LATE } as never);
    const midToolUse = AssistantToolUseChatEntryStub({ uuid: UUID_B, timestamp: TS_MID } as never);
    const earlyUser = UserChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);

    const result = sortChatEntriesByTimestampTransformer({
      entries: [lateText, midToolUse, earlyUser],
    });

    expect(result).toStrictEqual([earlyUser, midToolUse, lateText]);
  });

  it('VALID: {pre-sorted entries} => returns same order', () => {
    const a = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const b = AssistantTextChatEntryStub({ uuid: UUID_B, timestamp: TS_MID } as never);
    const c = AssistantTextChatEntryStub({ uuid: UUID_C, timestamp: TS_LATE } as never);

    const result = sortChatEntriesByTimestampTransformer({ entries: [a, b, c] });

    expect(result).toStrictEqual([a, b, c]);
  });

  it('VALID: {input array} => returns NEW array (does not mutate input)', () => {
    const a = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_LATE } as never);
    const b = AssistantTextChatEntryStub({ uuid: UUID_B, timestamp: TS_EARLY } as never);
    const original = [a, b];
    const result = sortChatEntriesByTimestampTransformer({ entries: original });

    expect(original).toStrictEqual([a, b]);
    expect(result).toStrictEqual([b, a]);
  });
});
