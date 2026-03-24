import { questToListItemTransformer } from './quest-to-list-item-transformer';
import { QuestStub, SessionIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';
import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

describe('questToListItemTransformer', () => {
  describe('valid transformations', () => {
    it('VALID: {quest with no steps} => returns list item with undefined stepProgress', () => {
      const quest = QuestStub({ steps: [] });

      const result = questToListItemTransformer({ quest });

      expect(result.id).toBe(quest.id);
      expect(result.title).toBe(quest.title);
      expect(result.status).toBe(quest.status);
      expect(result.stepProgress).toBe(undefined);
    });

    it('VALID: {quest with steps and work items} => returns list item with stepProgress', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({ id: 'step-one' }),
          DependencyStepStub({ id: 'step-two' }),
          DependencyStepStub({ id: 'step-three' }),
        ],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-one'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-two'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000003',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-three'],
          }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('1/3');
    });

    it('VALID: {quest with all steps complete} => returns stepProgress showing all complete', () => {
      const quest = QuestStub({
        steps: [DependencyStepStub({ id: 'step-one' }), DependencyStepStub({ id: 'step-two' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-one'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: ['steps/step-two'],
          }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('2/2');
    });

    it('VALID: {quest with no complete steps} => returns stepProgress showing zero complete', () => {
      const quest = QuestStub({
        steps: [DependencyStepStub({ id: 'step-one' }), DependencyStepStub({ id: 'step-two' })],
        workItems: [
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000001',
            role: 'codeweaver',
            status: 'pending',
            relatedDataItems: ['steps/step-one'],
          }),
          WorkItemStub({
            id: 'a0000000-0000-0000-0000-000000000002',
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: ['steps/step-two'],
          }),
        ],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.stepProgress).toBe('0/2');
    });

    it('VALID: {quest with in_progress chat work item} => returns activeSessionId', () => {
      const sessionId = SessionIdStub();
      const quest = QuestStub({
        workItems: [WorkItemStub({ role: 'chaoswhisperer', status: 'in_progress', sessionId })],
      });

      const result = questToListItemTransformer({ quest });

      expect(result.activeSessionId).toBe(sessionId);
    });

    it('VALID: {quest without chat work items} => returns undefined activeSessionId', () => {
      const quest = QuestStub();

      const result = questToListItemTransformer({ quest });

      expect(result.activeSessionId).toBe(undefined);
    });
  });
});
