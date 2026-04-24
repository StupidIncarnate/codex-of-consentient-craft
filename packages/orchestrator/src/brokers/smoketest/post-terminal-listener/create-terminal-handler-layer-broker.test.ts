import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { createTerminalHandlerLayerBroker } from './create-terminal-handler-layer-broker';
import { createTerminalHandlerLayerBrokerProxy } from './create-terminal-handler-layer-broker.proxy';

describe('createTerminalHandlerLayerBroker', () => {
  describe('handler factory', () => {
    it('VALID: {factory call} => returns a callable handler accepting ({questId})', () => {
      createTerminalHandlerLayerBrokerProxy();

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      const handlerArity = handler.length;

      expect(handlerArity).toBe(1);
    });
  });

  describe('handler dispatch', () => {
    it('EMPTY: {questId not in listener state} => scenario-meta lookup is skipped, no dispatch', () => {
      const proxy = createTerminalHandlerLayerBrokerProxy();
      const getListenerEntry = jest.fn().mockReturnValue(undefined);
      const getScenarioMeta = jest.fn().mockReturnValue(undefined);
      const unregisterListener = jest.fn();

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });
      const questId = QuestIdStub({ value: 'q-not-listening' });

      handler({ questId });

      expect(getScenarioMeta.mock.calls).toStrictEqual([]);
      expect(proxy.getProcessCallArgs()).toStrictEqual([]);
    });

    it('EMPTY: {listener entry present but scenario meta missing} => no dispatch to processTerminalEventLayerBroker', () => {
      const proxy = createTerminalHandlerLayerBrokerProxy();
      const entry = SmoketestListenerEntryStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(undefined);
      const unregisterListener = jest.fn();

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });
      const questId = QuestIdStub({ value: 'q-no-meta' });

      handler({ questId });

      expect(proxy.getProcessCallArgs()).toStrictEqual([]);
    });

    it('VALID: {listener entry + scenario meta both present} => dispatches processTerminalEventLayerBroker once with full args', () => {
      const proxy = createTerminalHandlerLayerBrokerProxy();
      proxy.setupProcessSucceeds();
      const entry = SmoketestListenerEntryStub();
      const meta = SmoketestScenarioMetaStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(meta);
      const unregisterListener = jest.fn();

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });
      const questId = QuestIdStub({ value: 'q-full-dispatch' });

      handler({ questId });

      const calls = proxy.getProcessCallArgs();
      const argShapes = calls.map((c) => c[0]);

      expect(argShapes).toStrictEqual([
        {
          questId,
          entry,
          scenarioMeta: meta,
          unregisterListener,
        },
      ]);
    });

    it('VALID: {dispatched processTerminalEventLayerBroker rejects} => handler swallows rejection, logs to stderr', async () => {
      const proxy = createTerminalHandlerLayerBrokerProxy();
      proxy.setupProcessRejects({ error: new Error('boom') });
      const stderrCapture = proxy.silenceStderrAndCaptureLogs();
      const entry = SmoketestListenerEntryStub();
      const meta = SmoketestScenarioMetaStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(meta);
      const unregisterListener = jest.fn();

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });

      handler({ questId: QuestIdStub({ value: 'q-rejects' }) });

      // Allow microtasks to flush so the .catch fires.
      await Promise.resolve();
      await Promise.resolve();

      expect(stderrCapture.wroteRejectionLog()).toBe(true);
    });

    it('VALID: {dispatched broker rejects with entry.stopDriver present} => catch block stops driver and unregisters (defensive drain)', async () => {
      const proxy = createTerminalHandlerLayerBrokerProxy();
      proxy.setupProcessRejects({ error: new Error('unexpected') });
      proxy.silenceStderrAndCaptureLogs();
      const stopDriver = jest.fn();
      const entry = SmoketestListenerEntryStub({ stopDriver });
      const meta = SmoketestScenarioMetaStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(meta);
      const unregisterListener = jest.fn();
      const questId = QuestIdStub({ value: 'q-defensive-unregister' });

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });

      handler({ questId });

      // Allow microtasks to flush so the .catch fires.
      await Promise.resolve();
      await Promise.resolve();

      expect(stopDriver.mock.calls).toStrictEqual([[]]);
      expect(unregisterListener.mock.calls).toStrictEqual([[{ questId }]]);
    });

    it('VALID: {dispatched broker rejects with entry.stopDriver undefined} => catch block still unregisters (no crash on missing stopDriver)', async () => {
      const proxy = createTerminalHandlerLayerBrokerProxy();
      proxy.setupProcessRejects({ error: new Error('unexpected') });
      proxy.silenceStderrAndCaptureLogs();
      const entry = SmoketestListenerEntryStub();
      const meta = SmoketestScenarioMetaStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(meta);
      const unregisterListener = jest.fn();
      const questId = QuestIdStub({ value: 'q-defensive-no-driver' });

      const handler = createTerminalHandlerLayerBroker({
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });

      handler({ questId });

      await Promise.resolve();
      await Promise.resolve();

      expect(unregisterListener.mock.calls).toStrictEqual([[{ questId }]]);
    });
  });
});
