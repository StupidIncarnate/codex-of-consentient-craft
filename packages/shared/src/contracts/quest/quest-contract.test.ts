import { questContract } from './quest-contract';
import { QuestStub } from './quest.stub';

describe('questContract', () => {
  describe('valid quests', () => {
    it('VALID: minimal quest => parses successfully', () => {
      const quest = QuestStub();

      const result = questContract.parse(quest);

      expect(result.id).toBe('add-auth');
      expect(result.folder).toBe('001-add-auth');
      expect(result.title).toBe('Add Authentication');
      expect(result.status).toBe('in_progress');
    });

    it('VALID: quest with tasks => parses successfully', () => {
      const quest = QuestStub({
        tasks: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create service',
            type: 'implementation',
            status: 'complete',
          },
        ],
      });

      const result = questContract.parse(quest);

      expect(result.tasks).toHaveLength(1);

      const [firstTask] = result.tasks;

      expect(firstTask).toBeDefined();
      expect(firstTask?.name).toBe('Create service');
    });

    it('VALID: completed quest => parses successfully', () => {
      const quest = QuestStub({
        status: 'complete',
        completedAt: '2024-01-16T10:00:00.000Z',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          testing: { status: 'complete' },
          review: { status: 'complete' },
        },
      });

      const result = questContract.parse(quest);

      expect(result.status).toBe('complete');
      expect(result.completedAt).toBe('2024-01-16T10:00:00.000Z');
    });

    it('VALID: abandoned quest with reason => parses successfully', () => {
      const quest = QuestStub({
        status: 'abandoned',
        abandonReason: 'Requirements changed',
      });

      const result = questContract.parse(quest);

      expect(result.status).toBe('abandoned');
      expect(result.abandonReason).toBe('Requirements changed');
    });
  });

  describe('invalid quests', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        questContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: empty id => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          id: '',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: invalid status => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          status: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: invalid timestamp => throws validation error', () => {
      const baseQuest = QuestStub();

      expect(() => {
        questContract.parse({
          ...baseQuest,
          createdAt: 'not-a-timestamp',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
