import {
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { KillableProcessStub } from '../../../contracts/killable-process/killable-process.stub';
import { pathseekerPromptStatics } from '../../../statics/pathseeker-prompt/pathseeker-prompt-statics';
import { pathseekerPipelineBroker } from './pathseeker-pipeline-broker';
import { pathseekerPipelineBrokerProxy } from './pathseeker-pipeline-broker.proxy';

describe('pathseekerPipelineBroker', () => {
  describe('quest reached in_progress', () => {
    it('VALID: {quest.status=in_progress after exit} => calls onVerifySuccess and does not retry', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({ id: questId, status: 'in_progress' });
      proxy.setupQuestStatus({ quest });

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 0,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const { onVerifySuccess, onProcessUpdate } = proxy;

      expect(onVerifySuccess).toHaveBeenCalledTimes(1);
      expect(onProcessUpdate.mock.calls).toStrictEqual([]);
    });
  });

  describe('max attempts reached', () => {
    it('VALID: {attempt >= maxAttempts} => returns immediately without running', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 3,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const { onVerifySuccess, onProcessUpdate } = proxy;

      expect(onVerifySuccess.mock.calls).toStrictEqual([]);
      expect(onProcessUpdate.mock.calls).toStrictEqual([]);
    });
  });

  describe('agent signaled complete without transitioning', () => {
    it('VALID: {quest.status=seek_plan after exit, attempt=2} => retries once then stops at cap', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({ id: questId, status: 'seek_plan' });
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 2,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const { onVerifySuccess, onProcessUpdate } = proxy;

      expect(onVerifySuccess.mock.calls).toStrictEqual([]);
      expect(onProcessUpdate).toHaveBeenCalledTimes(1);
    });

    it('VALID: {all 3 attempts fail from attempt 0} => spawns 3 retries then stops', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({ id: questId, status: 'seek_walk' });
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 0,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const { onVerifySuccess, onProcessUpdate } = proxy;

      expect(onVerifySuccess.mock.calls).toStrictEqual([]);
      expect(onProcessUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe('resume hint prepended to $ARGUMENTS', () => {
    it('VALID: {quest.status=seek_scope} => spawned prompt contains seek resume guidance and Quest ID', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({ id: questId, status: 'seek_scope' });
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 2,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const expectedPrompt = pathseekerPromptStatics.prompt.template.replace(
        pathseekerPromptStatics.prompt.placeholders.arguments,
        `Current status: seek_scope.\nPrior planningNotes may exist — call get-planning-notes to load before starting work. Do NOT redo any phase whose artifact is already committed.\n\nQuest ID: ${questId}`,
      );

      expect(proxy.getLastSpawnedPrompt()).toBe(expectedPrompt);
    });

    it('VALID: {quest.status=seek_synth} => spawned prompt contains seek resume guidance', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({ id: questId, status: 'seek_synth' });
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 2,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const expectedPrompt = pathseekerPromptStatics.prompt.template.replace(
        pathseekerPromptStatics.prompt.placeholders.arguments,
        `Current status: seek_synth.\nPrior planningNotes may exist — call get-planning-notes to load before starting work. Do NOT redo any phase whose artifact is already committed.\n\nQuest ID: ${questId}`,
      );

      expect(proxy.getLastSpawnedPrompt()).toBe(expectedPrompt);
    });

    it('VALID: {quest.status=approved} => spawned prompt omits seek resume guidance', async () => {
      const proxy = pathseekerPipelineBrokerProxy();

      const processId = ProcessIdStub({ value: 'proc-12345' });
      const questId = QuestIdStub();
      const killableProcess = KillableProcessStub();

      const quest = QuestStub({ id: questId, status: 'approved' });
      proxy.setupQuestStatus({ quest });
      proxy.setupSpawnSuccess();

      await pathseekerPipelineBroker({
        processId,
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        killableProcess,
        attempt: 2,
        onVerifySuccess: proxy.onVerifySuccess,
        onProcessUpdate: proxy.onProcessUpdate,
      });

      const expectedPrompt = pathseekerPromptStatics.prompt.template.replace(
        pathseekerPromptStatics.prompt.placeholders.arguments,
        `Current status: approved.\n\nQuest ID: ${questId}`,
      );

      expect(proxy.getLastSpawnedPrompt()).toBe(expectedPrompt);
    });
  });
});
