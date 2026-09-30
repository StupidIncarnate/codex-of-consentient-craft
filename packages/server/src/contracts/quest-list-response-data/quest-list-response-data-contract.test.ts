import { questListResponseDataContract } from './quest-list-response-data-contract';
import { QuestListResponseDataStub } from './quest-list-response-data.stub';
import { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';

describe('questListResponseDataContract', () => {
  it('VALID: {default stub} => parses quests and skipped files', () => {
    const result = QuestListResponseDataStub();

    expect(questListResponseDataContract.parse(result)).toStrictEqual({
      quests: [QuestListItemStub()],
      skipped: [
        {
          questFolder: '002-broken',
          questFilePath: '002-broken/quest.json',
          reason: 'invalid json',
        },
      ],
    });
  });

  it('INVALID: {skipped entry missing reason} => throws validation error', () => {
    expect(() =>
      questListResponseDataContract.parse({
        quests: [],
        skipped: [{ questFolder: '002-broken', questFilePath: '002-broken/quest.json' }],
      }),
    ).toThrow(/received undefined/u);
  });
});
