import {
  DependencyStepStub,
  FilePathStub,
  QuestStub,
  StepIdStub,
} from '@dungeonmaster/shared/contracts';

import { questUpdateStepBroker } from './quest-update-step-broker';
import { questUpdateStepBrokerProxy } from './quest-update-step-broker.proxy';
import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';

describe('questUpdateStepBroker', () => {
  describe('successful updates', () => {
    it('VALID: {update status to complete} => updates step status in quest file', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: { status: 'complete' },
      });

      const writtenPath = proxy.getQuestWrittenPath();
      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenPath).toBe(questFilePath);
      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete' }],
      });
    });

    it('VALID: {update status and completedAt} => updates multiple fields', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'in_progress' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      const completedAt = IsoTimestampStub({ value: '2024-01-15T12:00:00.000Z' });

      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: { status: 'complete', completedAt },
      });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete', completedAt }],
      });
    });

    it('VALID: {update step in quest with multiple steps} => only updates specified step', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const stepId1 = StepIdStub({ value: 'create-login-api' });
      const stepId2 = StepIdStub({ value: 'setup-database' });
      const step1 = DependencyStepStub({ id: stepId1, status: 'pending', name: 'Step 1' });
      const step2 = DependencyStepStub({ id: stepId2, status: 'pending', name: 'Step 2' });
      const quest = QuestStub({ steps: [step1, step2] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      await questUpdateStepBroker({
        questFilePath,
        stepId: stepId1,
        updates: { status: 'complete' },
      });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step1, status: 'complete' }, step2],
      });
    });

    it('VALID: {updates contain id field} => preserves original step id', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const originalStepId = StepIdStub({ value: 'create-login-api' });
      const attemptedNewId = StepIdStub({ value: 'attempted-new-id' });
      const step = DependencyStepStub({ id: originalStepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteSuccess();

      await questUpdateStepBroker({
        questFilePath,
        stepId: originalStepId,
        updates: { status: 'complete', id: attemptedNewId } as never,
      });

      const writtenContent = proxy.getQuestWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete', id: originalStepId }],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {step not found} => throws error', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const existingStepId = StepIdStub({ value: 'create-login-api' });
      const nonExistentStepId = StepIdStub({ value: 'setup-database' });
      const step = DependencyStepStub({ id: existingStepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId: nonExistentStepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/Step with id .* not found/u);
    });

    it('ERROR: {file read fails} => throws error', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const questFilePath = FilePathStub({ value: '/quests/nonexistent.json' });

      proxy.setupQuestReadError({ error: new Error('ENOENT: no such file or directory') });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/Failed to read file/u);
    });

    it('ERROR: {invalid quest JSON} => throws parse error', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const questFilePath = FilePathStub({ value: '/quests/invalid.json' });

      proxy.setupQuestRead({ questJson: '{ invalid json }' });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/JSON/u);
    });

    it('ERROR: {file write fails} => throws error', async () => {
      const proxy = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'create-login-api' });
      const step = DependencyStepStub({ id: stepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      proxy.setupQuestRead({ questJson: JSON.stringify(quest) });
      proxy.setupQuestWriteError({ error: new Error('EACCES: permission denied') });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/EACCES/u);
    });
  });
});
