import { questDatabaseContract } from './quest-database-contract';
import { QuestDatabaseStub } from './quest-database.stub';

const createMinimalQuest = (): unknown => ({
  id: 'add-auth',
  folder: '001-add-auth',
  title: 'Add Authentication',
  status: 'in_progress',
  createdAt: '2024-01-15T10:00:00.000Z',
  phases: {
    discovery: { status: 'complete' },
    implementation: { status: 'in_progress' },
    testing: { status: 'pending' },
    review: { status: 'pending' },
  },
  executionLog: [],
  tasks: [],
  contexts: [],
  observables: [],
  steps: [],
  toolingRequirements: [],
});

describe('questDatabaseContract', () => {
  describe('valid input', () => {
    it('VALID: {quests: []} => returns empty quest database', () => {
      const result = questDatabaseContract.parse({ quests: [] });

      expect(result).toStrictEqual({ quests: [] });
    });

    it('VALID: {quests: [quest]} => returns database with quest', () => {
      const quest = createMinimalQuest();
      const result = questDatabaseContract.parse({ quests: [quest] });

      expect(result).toStrictEqual({ quests: [quest] });
    });
  });

  describe('invalid input', () => {
    it('INVALID_QUESTS: {quests: null} => throws validation error', () => {
      expect(() => questDatabaseContract.parse({ quests: null })).toThrow(
        /Expected array, received null/u,
      );
    });

    it('INVALID_QUESTS: {} => throws validation error for missing quests', () => {
      expect(() => questDatabaseContract.parse({})).toThrow(/Required/u);
    });
  });
});

describe('QuestDatabaseStub', () => {
  it('VALID: {} => returns default quest database', () => {
    const result = QuestDatabaseStub();

    expect(result).toStrictEqual({ quests: [] });
  });

  it('VALID: {quests: [quest]} => returns database with provided quest', () => {
    const quest = createMinimalQuest();
    const result = QuestDatabaseStub({ quests: [quest] as never });

    expect(result).toStrictEqual({ quests: [quest] });
  });
});
