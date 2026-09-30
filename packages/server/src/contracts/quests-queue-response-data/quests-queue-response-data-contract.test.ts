import { questsQueueResponseDataContract } from './quests-queue-response-data-contract';
import { QuestsQueueResponseDataStub } from './quests-queue-response-data.stub';
import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';

describe('questsQueueResponseDataContract', () => {
  it('VALID: {default stub} => parses to one queue entry', () => {
    const result = QuestsQueueResponseDataStub();

    expect(questsQueueResponseDataContract.parse(result)).toStrictEqual({
      entries: [QuestQueueEntryStub()],
    });
  });

  it('EMPTY: {entries: []} => parses an empty queue', () => {
    expect(questsQueueResponseDataContract.parse({ entries: [] })).toStrictEqual({ entries: [] });
  });

  it('INVALID: {missing entries} => throws validation error', () => {
    expect(() => questsQueueResponseDataContract.parse({})).toThrow(/received undefined/u);
  });
});
