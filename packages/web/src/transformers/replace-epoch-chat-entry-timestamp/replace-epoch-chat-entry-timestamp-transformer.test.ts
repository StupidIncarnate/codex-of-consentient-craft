import { AssistantTextChatEntryStub, UserChatEntryStub } from '@dungeonmaster/shared/contracts';

import { replaceEpochChatEntryTimestampTransformer } from './replace-epoch-chat-entry-timestamp-transformer';

describe('replaceEpochChatEntryTimestampTransformer', () => {
  it('VALID: {entry with epoch timestamp} => returns entry with observation-time timestamp', () => {
    const epochEntry = AssistantTextChatEntryStub({
      timestamp: '1970-01-01T00:00:00.000Z',
      content: 'epoch-timestamp-agent',
    });

    const before = Date.now();
    const result = replaceEpochChatEntryTimestampTransformer({ entry: epochEntry });
    const after = Date.now();

    const resultMs = Date.parse(String(result.timestamp));

    // Two paired inequalities prove resultMs is in [before, after] — epoch (0) fails both.
    expect(resultMs - before).toBeGreaterThanOrEqual(0);
    expect(after - resultMs).toBeGreaterThanOrEqual(0);
    expect(resultMs).toBeGreaterThan(0);
  });

  it('VALID: {entry with real timestamp} => returns the same entry unchanged', () => {
    const realEntry = AssistantTextChatEntryStub({
      timestamp: '2026-05-11T10:00:00.000Z',
      content: 'real-timestamp-agent',
    });

    const result = replaceEpochChatEntryTimestampTransformer({ entry: realEntry });

    expect(result).toStrictEqual(realEntry);
  });

  it('VALID: {user entry with epoch timestamp} => normalizes to observation time same as assistant entries', () => {
    const epochUser = UserChatEntryStub({
      timestamp: '1970-01-01T00:00:00.000Z',
      content: 'epoch-timestamp-user',
    });

    const before = Date.now();
    const result = replaceEpochChatEntryTimestampTransformer({ entry: epochUser });
    const after = Date.now();

    const resultMs = Date.parse(String(result.timestamp));

    expect(resultMs - before).toBeGreaterThanOrEqual(0);
    expect(after - resultMs).toBeGreaterThanOrEqual(0);
    expect(resultMs).toBeGreaterThan(0);
  });
});
