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
      const { fsReadFileProxy, fsWriteFileProxy } = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      fsReadFileProxy.resolves({ content: JSON.stringify(quest) });
      fsWriteFileProxy.succeeds();

      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: { status: 'complete' },
      });

      const writtenPath = fsWriteFileProxy.getWrittenPath();
      const writtenContent = fsWriteFileProxy.getWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenPath).toBe(questFilePath);
      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete' }],
      });
    });

    it('VALID: {update status and completedAt} => updates multiple fields', async () => {
      const { fsReadFileProxy, fsWriteFileProxy } = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'in_progress' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      fsReadFileProxy.resolves({ content: JSON.stringify(quest) });
      fsWriteFileProxy.succeeds();

      const completedAt = IsoTimestampStub({ value: '2024-01-15T12:00:00.000Z' });

      await questUpdateStepBroker({
        questFilePath,
        stepId,
        updates: { status: 'complete', completedAt },
      });

      const writtenContent = fsWriteFileProxy.getWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete', completedAt }],
      });
    });

    it('VALID: {update step in quest with multiple steps} => only updates specified step', async () => {
      const { fsReadFileProxy, fsWriteFileProxy } = questUpdateStepBrokerProxy();
      const stepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const stepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step1 = DependencyStepStub({ id: stepId1, status: 'pending', name: 'Step 1' });
      const step2 = DependencyStepStub({ id: stepId2, status: 'pending', name: 'Step 2' });
      const quest = QuestStub({ steps: [step1, step2] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      fsReadFileProxy.resolves({ content: JSON.stringify(quest) });
      fsWriteFileProxy.succeeds();

      await questUpdateStepBroker({
        questFilePath,
        stepId: stepId1,
        updates: { status: 'complete' },
      });

      const writtenContent = fsWriteFileProxy.getWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step1, status: 'complete' }, step2],
      });
    });

    it('VALID: {updates contain id field} => preserves original step id', async () => {
      const { fsReadFileProxy, fsWriteFileProxy } = questUpdateStepBrokerProxy();
      const originalStepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const attemptedNewId = StepIdStub({ value: 'ffffffff-ffff-ffff-ffff-ffffffffffff' });
      const step = DependencyStepStub({ id: originalStepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      fsReadFileProxy.resolves({ content: JSON.stringify(quest) });
      fsWriteFileProxy.succeeds();

      await questUpdateStepBroker({
        questFilePath,
        stepId: originalStepId,
        updates: { status: 'complete', id: attemptedNewId } as never,
      });

      const writtenContent = fsWriteFileProxy.getWrittenContent();
      const writtenQuest: unknown = JSON.parse(writtenContent as never);

      expect(writtenQuest).toStrictEqual({
        ...quest,
        steps: [{ ...step, status: 'complete', id: originalStepId }],
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {step not found} => throws error', async () => {
      const { fsReadFileProxy } = questUpdateStepBrokerProxy();
      const existingStepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const nonExistentStepId = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const step = DependencyStepStub({ id: existingStepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      fsReadFileProxy.resolves({ content: JSON.stringify(quest) });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId: nonExistentStepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/Step with id .* not found/u);
    });

    it('ERROR: {file read fails} => throws error', async () => {
      const { fsReadFileProxy } = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const questFilePath = FilePathStub({ value: '/quests/nonexistent.json' });

      fsReadFileProxy.rejects({ error: new Error('ENOENT: no such file or directory') });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/Failed to read file/u);
    });

    it('ERROR: {invalid quest JSON} => throws parse error', async () => {
      const { fsReadFileProxy } = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const questFilePath = FilePathStub({ value: '/quests/invalid.json' });

      fsReadFileProxy.resolves({ content: '{ invalid json }' });

      await expect(
        questUpdateStepBroker({
          questFilePath,
          stepId,
          updates: { status: 'complete' },
        }),
      ).rejects.toThrow(/JSON/u);
    });

    it('ERROR: {file write fails} => throws error', async () => {
      const { fsReadFileProxy, fsWriteFileProxy } = questUpdateStepBrokerProxy();
      const stepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({ id: stepId, status: 'pending' });
      const quest = QuestStub({ steps: [step] });
      const questFilePath = FilePathStub({ value: '/quests/quest-1.json' });

      fsReadFileProxy.resolves({ content: JSON.stringify(quest) });
      fsWriteFileProxy.throws({ error: new Error('EACCES: permission denied') });

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
