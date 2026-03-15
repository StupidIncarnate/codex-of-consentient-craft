import {
  DependencyStepStub,
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';

describe('runPathseekerLayerBroker', () => {
  describe('sessionId capture', () => {
    it('VALID: {spawn emits session_id line} => writes sessionId to work item', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub({ status: 'pending' })],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"captured-session-abc"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const questJsons = proxy.getPersistedQuestJsons();

      expect(questJsons.length).toBeGreaterThan(0);
    });
  });

  describe('resumeSessionId', () => {
    it('VALID: {workItem has sessionId} => passes resumeSessionId through to spawn args', async () => {
      const questId = QuestIdStub({ value: 'test-resume-quest' });
      const resumeSessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const workItemId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'pathseeker',
        status: 'in_progress',
        sessionId: resumeSessionId,
        maxAttempts: 3,
      });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub({ status: 'pending' })],
        workItems: [workItem],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"9c4d8f1c-3e38-48c9-bdec-22b61883b473"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        workItem,
        startPath: '/project/src' as never,
      });

      const spawnedArgs = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        '-p',
        expect.any(String),
        '--output-format',
        'stream-json',
        '--verbose',
        '--resume',
        '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
      ]);
    });
  });
});
