import { AssistantTextChatEntryStub, UserChatEntryStub } from '@dungeonmaster/shared/contracts';

import { upsertChatEntriesByUuidTransformer } from './upsert-chat-entries-by-uuid-transformer';

const UUID_A = '00000000-0000-4000-8000-00000000000a';
const UUID_B = '00000000-0000-4000-8000-00000000000b';
const TS_EARLY = '2026-01-01T00:00:00.000Z';
const TS_LATE = '2026-01-02T00:00:00.000Z';

const innerToArray = <K>(result: Map<K, Map<unknown, unknown>>, key: K): unknown[] => {
  const values: unknown[] = [];
  result.forEach((inner, k) => {
    if (k === key) {
      inner.forEach((v) => values.push(v));
    }
  });

  return values;
};

describe('upsertChatEntriesByUuidTransformer', () => {
  it('VALID: {empty prev, single entry} => returns map with inner uuid map containing the entry', () => {
    const entryA = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);

    const result = upsertChatEntriesByUuidTransformer({
      prev: new Map(),
      key: 'session-1',
      newEntries: [entryA],
    });

    expect(innerToArray(result, 'session-1')).toStrictEqual([entryA]);
  });

  it('VALID: {prev has key with one entry, add another entry} => merges into the same inner map', () => {
    const entryA = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const entryB = UserChatEntryStub({ uuid: UUID_B, timestamp: TS_LATE } as never);
    const prev = new Map([['session-1', new Map([[entryA.uuid, entryA]])]]);

    const result = upsertChatEntriesByUuidTransformer({
      prev,
      key: 'session-1',
      newEntries: [entryB],
    });

    expect(innerToArray(result, 'session-1')).toStrictEqual([entryA, entryB]);
  });

  it('VALID: {duplicate uuid in newEntries} => last-write-wins, single entry per uuid', () => {
    const original = AssistantTextChatEntryStub({
      content: 'first',
      uuid: UUID_A,
      timestamp: TS_EARLY,
    } as never);
    const replacement = AssistantTextChatEntryStub({
      content: 'second',
      uuid: UUID_A,
      timestamp: TS_EARLY,
    } as never);

    const result = upsertChatEntriesByUuidTransformer({
      prev: new Map([['session-1', new Map([[original.uuid, original]])]]),
      key: 'session-1',
      newEntries: [replacement],
    });

    expect(innerToArray(result, 'session-1')).toStrictEqual([replacement]);
  });

  it('VALID: {upsert} => returns NEW outer map (input untouched)', () => {
    const entryA = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const prev = new Map();

    upsertChatEntriesByUuidTransformer({
      prev,
      key: 'session-1',
      newEntries: [entryA],
    });

    expect(prev.size).toBe(0);
  });

  it('VALID: {upsert} => returns NEW inner map (existing inner map untouched)', () => {
    const entryA = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const entryB = UserChatEntryStub({ uuid: UUID_B, timestamp: TS_LATE } as never);
    const originalInner = new Map([[entryA.uuid, entryA]]);
    const prev = new Map([['session-1', originalInner]]);

    upsertChatEntriesByUuidTransformer({
      prev,
      key: 'session-1',
      newEntries: [entryB],
    });

    expect(originalInner.size).toBe(1);
  });
});
