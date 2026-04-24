import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { smoketestPostTerminalListenerBroker } from './smoketest-post-terminal-listener-broker';
import { smoketestPostTerminalListenerBrokerProxy } from './smoketest-post-terminal-listener-broker.proxy';

describe('smoketestPostTerminalListenerBroker', () => {
  describe('install wiring', () => {
    it('VALID: {install} => install callback receives a function handler exactly once', async () => {
      smoketestPostTerminalListenerBrokerProxy();
      const stop = jest.fn();
      const install = jest.fn().mockResolvedValue({ stop });

      await smoketestPostTerminalListenerBroker({
        install,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      const handlerArgsTypeofs = install.mock.calls.map((c) => typeof c[0]);

      expect(handlerArgsTypeofs).toStrictEqual(['function']);
    });

    it('VALID: {handle.stop} => delegates to the stop returned by install', async () => {
      smoketestPostTerminalListenerBrokerProxy();
      const stop = jest.fn();
      const install = jest.fn().mockResolvedValue({ stop });

      const handle = await smoketestPostTerminalListenerBroker({
        install,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      handle.stop();

      expect(stop.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {two install calls in a row} => each call installs a fresh handler instance (no internal de-dupe)', async () => {
      smoketestPostTerminalListenerBrokerProxy();
      const install = jest.fn().mockResolvedValue({ stop: (): void => undefined });

      await smoketestPostTerminalListenerBroker({
        install,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });
      await smoketestPostTerminalListenerBroker({
        install,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      // The broker itself does not de-duplicate install — caller (bootstrap responder) owns
      // the single-install gate. Two install calls => two distinct handler instances installed.
      const installCount = install.mock.calls.length;
      const firstHandler = install.mock.calls[0]?.[0];
      const secondHandler = install.mock.calls[1]?.[0];
      const handlersAreSameRef = firstHandler === secondHandler;

      expect(installCount).toBe(2);
      expect(handlersAreSameRef).toBe(false);
    });
  });

  describe('handler relays getListenerEntry / getScenarioMeta lookups for matching events', () => {
    it('VALID: {handler invoked with a registered questId} => both lookup callbacks receive the questId', async () => {
      smoketestPostTerminalListenerBrokerProxy();
      const entry = SmoketestListenerEntryStub();
      const meta = SmoketestScenarioMetaStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(meta);
      const unregisterListener = jest.fn();
      const install = jest.fn().mockResolvedValue({ stop: (): void => undefined });

      await smoketestPostTerminalListenerBroker({
        install,
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });

      const handler = install.mock.calls[0]?.[0] as (args: {
        questId: ReturnType<typeof QuestIdStub>;
      }) => void;
      const questId = QuestIdStub({ value: 'q-relay' });
      handler({ questId });

      const listenerLookupArgs = getListenerEntry.mock.calls.map((c) => c[0]);
      const metaLookupArgs = getScenarioMeta.mock.calls.map((c) => c[0]);

      expect(listenerLookupArgs).toStrictEqual([{ questId }]);
      expect(metaLookupArgs).toStrictEqual([{ questId }]);
    });
  });
});
