import { AgentTypeStub, ExecutionLogEntryStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { writeExecutionLogLayerBroker } from './write-execution-log-layer-broker';
import { writeExecutionLogLayerBrokerProxy } from './write-execution-log-layer-broker.proxy';

const stubReport = ExecutionLogEntryStub().report;

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
});
