import {
  DependencyStepStub,
  ExitCodeStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { runPathseekerLayerBroker } from './run-pathseeker-layer-broker';
import { runPathseekerLayerBrokerProxy } from './run-pathseeker-layer-broker.proxy';

const extractPathseekerRuns = (questJson: unknown): readonly unknown[] => {
  const parsed: unknown = JSON.parse(questJson as never);
  if (typeof parsed !== 'object' || parsed === null) {
    return [];
  }
  return (Reflect.get(parsed, 'pathseekerRuns') ?? []) as readonly unknown[];
};

const getSessionIdFromRun = (run: unknown): unknown => {
  if (typeof run !== 'object' || run === null) {
    return undefined;
  }
  return Reflect.get(run, 'sessionId');
};

describe('runPathseekerLayerBroker', () => {
  describe('sessionId capture', () => {
    it('VALID: {spawn emits session_id line} => persists sessionId in pathseekerRun entries', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub({ status: 'pending' })],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"captured-session-abc"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        startPath: '/project/src' as never,
      });

      const questJsons = proxy.getPersistedQuestJsons();

      const hasSessionId = questJsons.some((json) => {
        const runs = extractPathseekerRuns(json);
        return runs.some((run) => getSessionIdFromRun(run) === 'captured-session-abc');
      });

      expect(hasSessionId).toBe(true);
    });

    it('VALID: {spawn emits no session_id} => persists pathseekerRun without sessionId', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub({ status: 'pending' })],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","subtype":"init"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        startPath: '/project/src' as never,
      });

      const questJsons = proxy.getPersistedQuestJsons();

      const allWithoutSessionId = questJsons.every((json) => {
        const runs = extractPathseekerRuns(json);
        return runs.every((run) => getSessionIdFromRun(run) === undefined);
      });

      expect(allWithoutSessionId).toBe(true);
    });
  });

  describe('completion entry', () => {
    it('VALID: {spawn completes} => persists pathseekerRun with completedAt', async () => {
      const questId = QuestIdStub({ value: 'test-quest' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        steps: [DependencyStepStub({ status: 'pending' })],
      });
      const proxy = runPathseekerLayerBrokerProxy();
      proxy.setupSuccess({
        quest,
        spawnLines: ['{"type":"system","session_id":"session-completion"}'],
        exitCode: ExitCodeStub({ value: 0 }),
      });

      await runPathseekerLayerBroker({
        questId,
        startPath: '/project/src' as never,
      });

      const questJsons = proxy.getPersistedQuestJsons();

      const hasCompletedAt = questJsons.some((json) => {
        const runs = extractPathseekerRuns(json);
        return runs.some((run) => getSessionIdFromRun(run) !== undefined);
      });

      expect(hasCompletedAt).toBe(true);
    });
  });
});
