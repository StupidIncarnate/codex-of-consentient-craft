import {
  AgentTypeStub,
  ExecutionLogEntryStub,
  ObservableIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { writeExecutionLogLayerBroker } from './write-execution-log-layer-broker';
import { writeExecutionLogLayerBrokerProxy } from './write-execution-log-layer-broker.proxy';

const stubReport = ExecutionLogEntryStub().report;

const extractLastExecutionLogEntry = (questJsons: readonly unknown[]): unknown => {
  const lastJson = questJsons[questJsons.length - 1];
  const parsed: unknown = JSON.parse(lastJson as never);
  const log = Reflect.get(parsed as never, 'executionLog') as readonly unknown[];
  return log[log.length - 1];
};

describe('writeExecutionLogLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof writeExecutionLogLayerBroker).toBe('function');
    });
  });

  describe('outcome field derived from status', () => {
    it('VALID: {status: pass} => writes entry with outcome: pass', async () => {
      const quest = QuestStub({ executionLog: [] });
      const proxy = writeExecutionLogLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await writeExecutionLogLayerBroker({
        questId: quest.id,
        agentType: AgentTypeStub({ value: 'ward' }),
        status: 'pass',
        report: stubReport,
      });

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(1);

      const persistedQuest = JSON.parse(String(persisted[0]));
      const lastEntry = persistedQuest.executionLog.at(-1);

      expect(lastEntry.outcome).toBe('pass');
      expect(lastEntry.status).toBe('pass');
    });

    it('VALID: {status: fail} => writes entry with outcome: fail', async () => {
      const quest = QuestStub({ executionLog: [] });
      const proxy = writeExecutionLogLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await writeExecutionLogLayerBroker({
        questId: quest.id,
        agentType: AgentTypeStub({ value: 'siegemaster' }),
        status: 'fail',
        report: stubReport,
      });

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(1);

      const persistedQuest = JSON.parse(String(persisted[0]));
      const lastEntry = persistedQuest.executionLog.at(-1);

      expect(lastEntry.outcome).toBe('fail');
      expect(lastEntry.status).toBe('fail');
    });

    it('VALID: {status: start} => writes entry without outcome', async () => {
      const quest = QuestStub({ executionLog: [] });
      const proxy = writeExecutionLogLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await writeExecutionLogLayerBroker({
        questId: quest.id,
        agentType: AgentTypeStub({ value: 'pathseeker' }),
        status: 'start',
        report: stubReport,
      });

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(1);

      const persistedQuest = JSON.parse(String(persisted[0]));
      const lastEntry = persistedQuest.executionLog.at(-1);

      expect(lastEntry.outcome).toBeUndefined();
      expect(lastEntry.status).toBe('start');
    });
  });

  describe('failedObservableIds', () => {
    it('VALID: {failedObservableIds provided} => persists entry with failedObservableIds', async () => {
      const questId = QuestIdStub({ value: 'log-quest' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = writeExecutionLogLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      const failedIds = [
        ObservableIdStub({ value: 'login-redirects-to-dashboard' }),
        ObservableIdStub({ value: 'shows-error-on-invalid-creds' }),
      ];

      await writeExecutionLogLayerBroker({
        questId,
        agentType: 'siegemaster' as never,
        status: 'fail',
        report: 'siegemaster-phase-failed' as never,
        failedObservableIds: failedIds,
      });

      const questJsons = proxy.getPersistedQuestJsons();
      const entry = extractLastExecutionLogEntry(questJsons);
      const ids = Reflect.get(entry as never, 'failedObservableIds');

      expect(ids).toStrictEqual(['login-redirects-to-dashboard', 'shows-error-on-invalid-creds']);
    });

    it('VALID: {no failedObservableIds} => persists entry with empty failedObservableIds', async () => {
      const questId = QuestIdStub({ value: 'log-quest-empty' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = writeExecutionLogLayerBrokerProxy();
      proxy.setupQuestFound({ quest });

      await writeExecutionLogLayerBroker({
        questId,
        agentType: 'ward' as never,
        status: 'pass',
        report: 'ward-phase' as never,
      });

      const questJsons = proxy.getPersistedQuestJsons();
      const entry = extractLastExecutionLogEntry(questJsons);
      const ids = Reflect.get(entry as never, 'failedObservableIds');

      expect(ids).toStrictEqual([]);
    });
  });
});
