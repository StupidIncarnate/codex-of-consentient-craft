import { questListItemContract } from './quest-list-item-contract';
import { QuestListItemStub } from './quest-list-item.stub';

describe('questListItemContract', () => {
  describe('valid list items', () => {
    it('VALID: full list item => parses successfully', () => {
      const item = QuestListItemStub();

      const result = questListItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        stepProgress: '2/5',
      });
    });

    it('VALID: completed item => parses successfully', () => {
      const item = QuestListItemStub({
        status: 'complete',
        stepProgress: '5/5',
      });

      const result = questListItemContract.parse(item);

      expect(result.status).toBe('complete');
      expect(result.stepProgress).toBe('5/5');
    });

    it('VALID: item without step progress => parses successfully', () => {
      const item = QuestListItemStub({
        stepProgress: undefined,
      });

      const result = questListItemContract.parse(item);

      expect(result.stepProgress).toBeUndefined();
    });
  });

  describe('invalid list items', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        questListItemContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid status => throws validation error', () => {
      const baseItem = QuestListItemStub();

      expect(() => {
        questListItemContract.parse({
          ...baseItem,
          status: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
