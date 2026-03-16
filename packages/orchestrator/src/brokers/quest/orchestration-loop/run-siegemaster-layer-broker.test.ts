import {
  ExitCodeStub,
  FilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { StreamSignalStub } from '../../../contracts/stream-signal/stream-signal.stub';
import { runSiegemasterLayerBroker } from './run-siegemaster-layer-broker';
import { runSiegemasterLayerBrokerProxy } from './run-siegemaster-layer-broker.proxy';

describe('runSiegemasterLayerBroker', () => {
  describe('export', () => {
    it('VALID: {module} => exports a function', () => {
      expect(typeof runSiegemasterLayerBroker).toBe('function');
    });
  });

  describe('complete signal without failure marker', () => {
    it('VALID: {signal: complete, no FAILED OBSERVABLES} => resolves without error', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const quest = QuestStub({ flows: [flow] });
      const workItem = WorkItemStub({ role: 'siegemaster' });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({ signal: 'complete', summary: 'All tests pass' as never }),
      });

      await expect(
        runSiegemasterLayerBroker({
          questId: quest.id,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('complete signal with failure marker', () => {
    it('VALID: {signal: complete, summary has FAILED OBSERVABLES} => resolves (marks failed + creates fix chain)', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const quest = QuestStub({ flows: [flow] });
      const workItem = WorkItemStub({ role: 'siegemaster' });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 0 }),
        signal: StreamSignalStub({
          signal: 'complete',
          summary: 'FAILED OBSERVABLES: login form did not redirect' as never,
        }),
      });

      await expect(
        runSiegemasterLayerBroker({
          questId: quest.id,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('failed signal', () => {
    it('VALID: {signal: failed} => resolves (marks failed + creates fix chain)', async () => {
      const observable = FlowObservableStub();
      const node = FlowNodeStub({ observables: [observable] });
      const flow = FlowStub({ nodes: [node] });
      const quest = QuestStub({ flows: [flow] });
      const workItem = WorkItemStub({ role: 'siegemaster' });

      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupSpawnWithSignal({
        quest,
        exitCode: ExitCodeStub({ value: 1 }),
        signal: StreamSignalStub({ signal: 'failed' }),
      });

      await expect(
        runSiegemasterLayerBroker({
          questId: quest.id,
          workItem,
          startPath: FilePathStub({ value: '/project' }),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('quest not found', () => {
    it('ERROR: {quest not found} => throws', async () => {
      const proxy = runSiegemasterLayerBrokerProxy();
      proxy.setupQuestNotFound();
      const workItem = WorkItemStub({ role: 'siegemaster' });

      await expect(
        runSiegemasterLayerBroker({
          questId: 'nonexistent' as never,
          workItem,
          startPath: '/some/path' as never,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
