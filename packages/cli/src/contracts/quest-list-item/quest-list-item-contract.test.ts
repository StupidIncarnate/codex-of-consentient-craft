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
        currentPhase: 'implementation',
        taskProgress: '2/5',
      });
    });

    it('VALID: completed item without current phase => parses successfully', () => {
      const item = QuestListItemStub({
        status: 'complete',
        currentPhase: undefined,
        taskProgress: '5/5',
      });

      const result = questListItemContract.parse(item);

      expect(result.status).toBe('complete');
      expect(result.currentPhase).toBeUndefined();
    });

    it('VALID: item without task progress => parses successfully', () => {
      const item = QuestListItemStub({
        taskProgress: undefined,
      });

      const result = questListItemContract.parse(item);

      expect(result.taskProgress).toBeUndefined();
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

    it('INVALID: invalid phase type => throws validation error', () => {
      const baseItem = QuestListItemStub();

      expect(() => {
        questListItemContract.parse({
          ...baseItem,
          currentPhase: 'invalid_phase',
        });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
