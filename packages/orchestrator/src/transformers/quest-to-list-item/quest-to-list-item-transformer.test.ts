import { questToListItemTransformer } from './quest-to-list-item-transformer';
import { QuestStub } from '@dungeonmaster/shared/contracts';
import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

describe('questToListItemTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {quest with no steps} => returns list item with undefined stepProgress', () => {
      const quest = QuestStub({ steps: [] });

      const result = questToListItemTransformer({ quest });

      expect(result).toStrictEqual({
        id: quest.id,
        folder: quest.folder,
        title: quest.title,
        status: quest.status,
        createdAt: quest.createdAt,
        stepProgress: undefined,
      });
    });

    it('VALID: {quest with steps} => returns list item with stepProgress', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ status: 'complete' }),
          DependencyStepStub({ status: 'pending' }),
          DependencyStepStub({ status: 'pending' }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result).toStrictEqual({
        id: quest.id,
        folder: quest.folder,
        title: quest.title,
        status: quest.status,
        createdAt: quest.createdAt,
        stepProgress: '1/3',
      });
    });

    it('VALID: {quest with all steps complete} => returns stepProgress showing all complete', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ status: 'complete' }),
          DependencyStepStub({ status: 'complete' }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('2/2');
    });

    it('VALID: {quest with no complete steps} => returns stepProgress showing zero complete', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ status: 'pending' }),
          DependencyStepStub({ status: 'in_progress' }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('0/2');
    });
  });
});
