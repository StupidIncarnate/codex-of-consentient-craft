import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questsToListItemsTransformer } from './quests-to-list-items-transformer';

describe('questsToListItemsTransformer', () => {
  describe('recency ordering', () => {
    it('VALID: {quests out of order} => returns list items sorted most-recent-first', () => {
      const older = QuestStub({
        id: 'q-older',
        title: 'Older',
        createdAt: '2024-01-01T00:00:00.000Z',
      });
      const newest = QuestStub({
        id: 'q-newest',
        title: 'Newest',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
      });
      const middle = QuestStub({
        id: 'q-middle',
        title: 'Middle',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      });

      const result = questsToListItemsTransformer({ quests: [older, newest, middle] });

      expect(result.map((item) => item.id)).toStrictEqual([newest.id, middle.id, older.id]);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {no quests} => returns empty array', () => {
      expect(questsToListItemsTransformer({ quests: [] })).toStrictEqual([]);
    });
  });
});
