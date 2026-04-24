import { questQueueEntryContract } from './quest-queue-entry-contract';
import { QuestQueueEntryStub } from './quest-queue-entry.stub';

describe('questQueueEntryContract', () => {
  it('VALID: {minimal required fields} => parses into QuestQueueEntry', () => {
    const entry = QuestQueueEntryStub();

    expect(entry).toStrictEqual({
      questId: 'add-auth',
      guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      guildSlug: 'my-guild',
      questTitle: 'Add Authentication',
      status: 'in_progress',
      enqueuedAt: '2024-01-15T10:00:00.000Z',
    });
  });

  it('VALID: {all fields incl. questSource, startedAt, error, activeSessionId} => parses fully populated entry', () => {
    const entry = QuestQueueEntryStub({
      questSource: 'smoketest-orchestration',
      activeSessionId: 'chat-session-abc' as never,
      startedAt: '2024-01-15T10:05:00.000Z' as never,
      error: {
        message: 'runner threw' as never,
        at: '2024-01-15T10:06:00.000Z' as never,
      },
    });

    expect(entry).toStrictEqual({
      questId: 'add-auth',
      guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      guildSlug: 'my-guild',
      questTitle: 'Add Authentication',
      status: 'in_progress',
      questSource: 'smoketest-orchestration',
      activeSessionId: 'chat-session-abc',
      enqueuedAt: '2024-01-15T10:00:00.000Z',
      startedAt: '2024-01-15T10:05:00.000Z',
      error: {
        message: 'runner threw',
        at: '2024-01-15T10:06:00.000Z',
      },
    });
  });

  it('INVALID: {missing questId} => throws validation error', () => {
    expect(() => {
      return questQueueEntryContract.parse({
        guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        guildSlug: 'my-guild',
        questTitle: 'Add Authentication',
        status: 'in_progress',
        enqueuedAt: '2024-01-15T10:00:00.000Z',
      });
    }).toThrow(/questId/u);
  });

  it('INVALID: {empty questTitle} => throws validation error', () => {
    expect(() => {
      return QuestQueueEntryStub({ questTitle: '' as never });
    }).toThrow(/at least 1/u);
  });

  it('INVALID: {bad status enum} => throws validation error', () => {
    expect(() => {
      return QuestQueueEntryStub({ status: 'not-a-status' as never });
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {bad questSource enum} => throws validation error', () => {
    expect(() => {
      return QuestQueueEntryStub({ questSource: 'smoketest-unknown' as never });
    }).toThrow(/Invalid enum value/u);
  });

  it('INVALID: {bad enqueuedAt format} => throws validation error', () => {
    expect(() => {
      return QuestQueueEntryStub({ enqueuedAt: 'not-a-timestamp' as never });
    }).toThrow(/datetime/u);
  });

  it('INVALID: {error.message empty} => throws validation error', () => {
    expect(() => {
      return QuestQueueEntryStub({
        error: {
          message: '' as never,
          at: '2024-01-15T10:06:00.000Z' as never,
        },
      });
    }).toThrow(/at least 1/u);
  });
});
