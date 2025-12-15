import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questToListItemTransformer } from './quest-to-list-item-transformer';

describe('questToListItemTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {in_progress quest} => returns list item with current phase', () => {
      const quest = QuestStub();

      const result = questToListItemTransformer({ quest });

      expect(result).toStrictEqual({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
        status: 'in_progress',
        createdAt: '2024-01-15T10:00:00.000Z',
        currentPhase: 'implementation',
        taskProgress: '0/0',
      });
    });

    it('VALID: {quest with tasks} => returns correct task progress', () => {
      const quest = QuestStub({
        tasks: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Task 1',
            type: 'implementation',
            status: 'complete',
          },
          {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Task 2',
            type: 'implementation',
            status: 'in_progress',
          },
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.taskProgress).toBe('1/2');
    });

    it('VALID: {completed quest} => returns undefined currentPhase', () => {
      const quest = QuestStub({
        status: 'complete',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'complete' },
          testing: { status: 'complete' },
          review: { status: 'complete' },
        },
      });

      const result = questToListItemTransformer({ quest });

      expect(result.status).toBe('complete');
      expect(result.currentPhase).toBeUndefined();
    });

    it('VALID: {blocked quest} => returns blocked phase', () => {
      const quest = QuestStub({
        status: 'blocked',
        phases: {
          discovery: { status: 'complete' },
          implementation: { status: 'blocked' },
          testing: { status: 'pending' },
          review: { status: 'pending' },
        },
      });

      const result = questToListItemTransformer({ quest });

      expect(result.currentPhase).toBe('implementation');
    });
  });
});
