import {
  ExitCodeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';

describe('runSiegemasterLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runSiegemasterLayerBroker).toBe('function');
    });
  });

  describe('failedObservableIds', () => {
    it('VALID: {all agents signal complete} => returns empty failedObservableIds', async () => {
      const questId = QuestIdStub({ value: 'siege-quest' });
      const observable1 = FlowObservableStub({ id: 'login-redirects-to-dashboard' });
      const observable2 = FlowObservableStub({ id: 'shows-error-on-invalid-creds' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [observable1, observable2] })],
          }),
        ],
      });
      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupAllComplete({ quest, exitCode: ExitCodeStub({ value: 0 }) });

      const result = await runSiegemasterLayerBroker({
        questId,
        questFilePath: '/quests/quest.json' as never,
        startPath: '/project/src' as never,
      });

      expect(result.failedObservableIds).toStrictEqual([]);
    });

    it('VALID: {all agents fail without complete signal} => returns all observable IDs as failed', async () => {
      const questId = QuestIdStub({ value: 'siege-quest-fail' });
      const observable1 = FlowObservableStub({ id: 'login-redirects-to-dashboard' });
      const observable2 = FlowObservableStub({ id: 'shows-error-on-invalid-creds' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [observable1, observable2] })],
          }),
        ],
      });
      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupAllSucceedWithoutSignal({ quest, exitCode: ExitCodeStub({ value: 0 }) });

      const result = await runSiegemasterLayerBroker({
        questId,
        questFilePath: '/quests/quest.json' as never,
        startPath: '/project/src' as never,
      });

      expect(result.failedObservableIds).toStrictEqual([
        'login-redirects-to-dashboard',
        'shows-error-on-invalid-creds',
      ]);
    });

    it('VALID: {no observables} => returns empty failedObservableIds', async () => {
      const questId = QuestIdStub({ value: 'siege-quest-empty' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [] })],
          }),
        ],
      });
      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupAllComplete({ quest, exitCode: ExitCodeStub({ value: 0 }) });

      const result = await runSiegemasterLayerBroker({
        questId,
        questFilePath: '/quests/quest.json' as never,
        startPath: '/project/src' as never,
      });

      expect(result.failedObservableIds).toStrictEqual([]);
    });
  });
});
