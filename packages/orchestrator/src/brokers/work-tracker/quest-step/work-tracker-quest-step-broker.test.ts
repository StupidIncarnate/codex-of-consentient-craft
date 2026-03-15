import {
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { workTrackerQuestStepBroker } from './work-tracker-quest-step-broker';
import { workTrackerQuestStepBrokerProxy } from './work-tracker-quest-step-broker.proxy';
import { WorkItemIdStub } from '../../../contracts/work-item-id/work-item-id.stub';
import { WorkUnitStub } from '../../../contracts/work-unit/work-unit.stub';

describe('workTrackerQuestStepBroker', () => {
  describe('markCompleted()', () => {
    it('VALID: {pending step} => updates step status to complete in quest file', async () => {
      const proxy = workTrackerQuestStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'create-login-api' });

      await tracker.markCompleted({ workItemId });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete' }],
      });
    });
  });

  describe('markStarted()', () => {
    it('VALID: {pending step} => updates step status to in-progress', async () => {
      const proxy = workTrackerQuestStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'create-login-api' });

      await tracker.markStarted({ workItemId });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'in_progress' }],
      });
    });
  });

  describe('markFailed()', () => {
    it('VALID: {started step} => updates step status to failed', async () => {
      const proxy = workTrackerQuestStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'in_progress' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'create-login-api' });

      await tracker.markFailed({ workItemId });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'failed' }],
      });
    });
  });

  describe('markBlocked()', () => {
    it('VALID: {started step} => updates step status to blocked', async () => {
      const proxy = workTrackerQuestStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'in_progress' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'create-login-api' });

      await tracker.markBlocked({ workItemId, targetRole: 'spiritmender' });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'blocked' }],
      });
    });
  });

  describe('markPartiallyCompleted()', () => {
    it('VALID: {started step} => updates step status to partially-complete', async () => {
      const proxy = workTrackerQuestStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'in_progress' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'create-login-api' });

      await tracker.markPartiallyCompleted({ workItemId });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'partially_complete' }],
      });
    });
  });

  describe('unsupported sync operations', () => {
    it('ERROR: {getReadyWorkIds} => throws sync not supported', () => {
      workTrackerQuestStepBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });

      expect(() => tracker.getReadyWorkIds()).toThrow(/requires async quest load/u);
    });

    it('ERROR: {getWorkUnit} => throws sync not supported', () => {
      workTrackerQuestStepBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'some-step' });

      expect(() => tracker.getWorkUnit({ workItemId })).toThrow(/requires async quest load/u);
    });

    it('ERROR: {isAllComplete} => throws sync not supported', () => {
      workTrackerQuestStepBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });

      expect(() => tracker.isAllComplete()).toThrow(/requires async quest load/u);
    });

    it('ERROR: {addWorkItem} => throws not supported', () => {
      workTrackerQuestStepBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });
      const tracker = workTrackerQuestStepBroker({ questFilePath, role: 'codeweaver' });
      const workItemId = WorkItemIdStub({ value: 'some-step' });

      expect(() => {
        tracker.addWorkItem({ workItemId, workUnit: WorkUnitStub() });
      }).toThrow(/not supported for quest-step/u);
    });
  });
});
