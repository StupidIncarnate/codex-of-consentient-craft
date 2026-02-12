import { questListResponseContract } from './quest-list-response-contract';
import { QuestListResponseStub } from './quest-list-response.stub';
import { QuestListItemStub } from '@dungeonmaster/shared/contracts';

describe('questListResponseContract', () => {
  describe('valid responses', () => {
    it('VALID: {array of quest list items} => parses successfully', () => {
      const items = QuestListResponseStub();

      const result = questListResponseContract.parse(items);

      expect(result).toStrictEqual([
        {
          id: 'add-auth',
          folder: '001-add-auth',
          title: 'Add Authentication',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          stepProgress: '2/5',
        },
      ]);
    });

    it('EMPTY: {empty array} => parses successfully', () => {
      const result = questListResponseContract.parse([]);

      expect(result).toStrictEqual([]);
    });

    it('VALID: {multiple items} => parses all items', () => {
      const items = QuestListResponseStub({
        value: [
          QuestListItemStub({ id: 'quest-1' as never, title: 'First Quest' as never }),
          QuestListItemStub({ id: 'quest-2' as never, title: 'Second Quest' as never }),
        ],
      });

      const result = questListResponseContract.parse(items);

      expect(result).toStrictEqual([
        {
          id: 'quest-1',
          folder: '001-add-auth',
          title: 'First Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          stepProgress: '2/5',
        },
        {
          id: 'quest-2',
          folder: '001-add-auth',
          title: 'Second Quest',
          status: 'in_progress',
          createdAt: '2024-01-15T10:00:00.000Z',
          stepProgress: '2/5',
        },
      ]);
    });
  });

  describe('invalid responses', () => {
    it('INVALID_ITEM: {invalid item in array} => throws validation error', () => {
      expect(() => {
        questListResponseContract.parse([{ invalid: true }]);
      }).toThrow(/Required/u);
    });
  });
});
