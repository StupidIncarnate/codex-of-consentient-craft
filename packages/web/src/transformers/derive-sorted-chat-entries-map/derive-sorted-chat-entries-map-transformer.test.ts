import { AssistantTextChatEntryStub, UserChatEntryStub } from '@dungeonmaster/shared/contracts';

import { deriveSortedChatEntriesMapTransformer } from './derive-sorted-chat-entries-map-transformer';

const UUID_A = '00000000-0000-4000-8000-00000000000a';
const UUID_B = '00000000-0000-4000-8000-00000000000b';
const UUID_C = '00000000-0000-4000-8000-00000000000c';
const TS_EARLY = '2026-01-01T00:00:00.000Z';
const TS_MID = '2026-01-02T00:00:00.000Z';
const TS_LATE = '2026-01-03T00:00:00.000Z';

describe('deriveSortedChatEntriesMapTransformer', () => {
  it('VALID: {one session with three entries inserted out of order} => returns Map with sorted ChatEntry[] for that session', () => {
    const late = AssistantTextChatEntryStub({ uuid: UUID_C, timestamp: TS_LATE } as never);
    const early = UserChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const mid = AssistantTextChatEntryStub({ uuid: UUID_B, timestamp: TS_MID } as never);
    const inner = new Map([
      [late.uuid, late],
      [early.uuid, early],
      [mid.uuid, mid],
    ]);
    const source = new Map([['session-1', inner]]);

    const result = deriveSortedChatEntriesMapTransformer({ source });

    expect(result).toStrictEqual(new Map([['session-1', [early, mid, late]]]));
  });

  it('VALID: {multiple sessions, each independently sorted} => returns Map with each session sorted', () => {
    const entryA = AssistantTextChatEntryStub({ uuid: UUID_A, timestamp: TS_EARLY } as never);
    const entryB = UserChatEntryStub({ uuid: UUID_B, timestamp: TS_LATE } as never);
    const entryC = AssistantTextChatEntryStub({ uuid: UUID_C, timestamp: TS_MID } as never);
    const source = new Map([
      [
        'session-1',
        new Map([
          [entryB.uuid, entryB],
          [entryA.uuid, entryA],
        ]),
      ],
      ['session-2', new Map([[entryC.uuid, entryC]])],
    ]);

    const result = deriveSortedChatEntriesMapTransformer({ source });

    expect(result).toStrictEqual(
      new Map([
        ['session-1', [entryA, entryB]],
        ['session-2', [entryC]],
      ]),
    );
  });

  it('VALID: {empty source} => returns empty Map', () => {
    const result = deriveSortedChatEntriesMapTransformer({ source: new Map() });

    expect(result).toStrictEqual(new Map());
  });

  it('VALID: {session with empty inner map} => returns Map with empty array for that session', () => {
    const source = new Map([['session-1', new Map()]]);

    const result = deriveSortedChatEntriesMapTransformer({ source });

    expect(result).toStrictEqual(new Map([['session-1', []]]));
  });
});
