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
      const result = questListItemContract.parse({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: item with activeSessionId => parses successfully', () => {
      const item = QuestListItemStub({
        activeSessionId: 'session-abc-123',
      });

      const result = questListItemContract.parse(item);

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        stepProgress: '2/5',
        activeSessionId: 'session-abc-123',
      });
    });

    it('VALID: item without activeSessionId => parses without it', () => {
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
  });

  describe('invalid list items', () => {
    it('INVALID_ID: {id: empty string} => throws validation error', () => {
      expect(() => {
        questListItemContract.parse({
          ...QuestListItemStub(),
          id: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_FOLDER: {folder: empty string} => throws validation error', () => {
      expect(() => {
        questListItemContract.parse({
          ...QuestListItemStub(),
          folder: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TITLE: {title: empty string} => throws validation error', () => {
      expect(() => {
        questListItemContract.parse({
          ...QuestListItemStub(),
          title: '',
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID_CREATED_AT: {createdAt: invalid} => throws validation error', () => {
      expect(() => {
        questListItemContract.parse({
          ...QuestListItemStub(),
          createdAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });

    it('INVALID_ACTIVE_SESSION_ID: {activeSessionId: empty string} => throws validation error', () => {
      expect(() => {
        questListItemContract.parse({
          ...QuestListItemStub(),
          activeSessionId: '',
        });
      }).toThrow(/too_small/u);
    });

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
