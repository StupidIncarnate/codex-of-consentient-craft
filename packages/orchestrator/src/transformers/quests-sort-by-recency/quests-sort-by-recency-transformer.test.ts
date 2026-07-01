import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questsSortByRecencyTransformer } from './quests-sort-by-recency-transformer';

describe('questsSortByRecencyTransformer', () => {
  describe('recency ordering', () => {
    it('VALID: {quests out of order} => sorts most-recent-first by updatedAt ?? createdAt', () => {
      const older = QuestStub({ id: 'q-older', createdAt: '2024-01-01T00:00:00.000Z' });
      const newest = QuestStub({
        id: 'q-newest',
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-20T00:00:00.000Z',
      });
      const middle = QuestStub({
        id: 'q-middle',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
      });

      const result = questsSortByRecencyTransformer({ quests: [older, newest, middle] });

      expect(result).toStrictEqual([newest, middle, older]);
    });

    it('VALID: {quest with no updatedAt} => falls back to createdAt for that quest', () => {
      const neverModified = QuestStub({ id: 'q-fresh', createdAt: '2024-02-01T00:00:00.000Z' });
      const modifiedEarlier = QuestStub({
        id: 'q-stale',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-31T00:00:00.000Z',
      });

      const result = questsSortByRecencyTransformer({
        quests: [modifiedEarlier, neverModified],
      });

      expect(result).toStrictEqual([neverModified, modifiedEarlier]);
    });
  });

  describe('empty list', () => {
    it('EMPTY: {no quests} => returns empty array', () => {
      expect(questsSortByRecencyTransformer({ quests: [] })).toStrictEqual([]);
    });
  });
});
