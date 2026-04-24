import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { smoketestPostTerminalListenerBroker } from './smoketest-post-terminal-listener-broker';
import { smoketestPostTerminalListenerBrokerProxy } from './smoketest-post-terminal-listener-broker.proxy';

describe('smoketestPostTerminalListenerBroker', () => {
  describe('subscription wiring', () => {
    it('VALID: {install} => subscribe receives a function handler exactly once', () => {
      smoketestPostTerminalListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();

      smoketestPostTerminalListenerBroker({
        subscribe,
        unsubscribe,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      const handlerArgsTypeofs = subscribe.mock.calls.map((c) => typeof c[0]);

      expect(handlerArgsTypeofs).toStrictEqual(['function']);
    });

    it('VALID: {stop after install} => unsubscribe receives the SAME handler instance subscribe got', () => {
      smoketestPostTerminalListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();

      const handle = smoketestPostTerminalListenerBroker({
        subscribe,
        unsubscribe,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      handle.stop();

      const subscribedHandler = subscribe.mock.calls[0]?.[0];
      const unsubscribedHandler = unsubscribe.mock.calls[0]?.[0];

      expect(subscribedHandler).toBe(unsubscribedHandler);
    });

    it('VALID: {two install calls in a row} => each call subscribes a fresh handler instance (no internal de-dupe)', () => {
      smoketestPostTerminalListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();

      smoketestPostTerminalListenerBroker({
        subscribe,
        unsubscribe,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });
      smoketestPostTerminalListenerBroker({
        subscribe,
        unsubscribe,
        getListenerEntry: (): undefined => undefined,
        unregisterListener: (): undefined => undefined,
        getScenarioMeta: (): undefined => undefined,
      });

      // The broker itself does not de-duplicate subscribe — caller (bootstrap responder) owns
      // the single-install gate. Two install calls => two distinct handler instances subscribed.
      const subscribeCount = subscribe.mock.calls.length;
      const firstHandler = subscribe.mock.calls[0]?.[0];
      const secondHandler = subscribe.mock.calls[1]?.[0];
      const handlersAreSameRef = firstHandler === secondHandler;

      expect(subscribeCount).toBe(2);
      expect(handlersAreSameRef).toBe(false);
    });
  });

  describe('handler relays getListenerEntry / getScenarioMeta lookups for matching events', () => {
    it('VALID: {handler invoked with a registered questId} => both lookup callbacks receive the questId', () => {
      smoketestPostTerminalListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();
      const entry = SmoketestListenerEntryStub();
      const meta = SmoketestScenarioMetaStub();
      const getListenerEntry = jest.fn().mockReturnValue(entry);
      const getScenarioMeta = jest.fn().mockReturnValue(meta);
      const unregisterListener = jest.fn();

      smoketestPostTerminalListenerBroker({
        subscribe,
        unsubscribe,
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });

      const handler = subscribe.mock.calls[0]?.[0] as (event: {
        processId: ReturnType<typeof ProcessIdStub>;
        payload: { questId?: unknown };
      }) => void;
      const questId = QuestIdStub({ value: 'q-relay' });
      handler({
        processId: ProcessIdStub({ value: 'proc-relay' }),
        payload: { questId },
      });

      const listenerLookupArgs = getListenerEntry.mock.calls.map((c) => c[0]);
      const metaLookupArgs = getScenarioMeta.mock.calls.map((c) => c[0]);

      expect(listenerLookupArgs).toStrictEqual([{ questId }]);
      expect(metaLookupArgs).toStrictEqual([{ questId }]);
    });

    it('EMPTY: {handler invoked with payload missing questId} => no lookup callback fires', () => {
      smoketestPostTerminalListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();
      const getListenerEntry = jest.fn().mockReturnValue(undefined);
      const getScenarioMeta = jest.fn().mockReturnValue(undefined);
      const unregisterListener = jest.fn();

      smoketestPostTerminalListenerBroker({
        subscribe,
        unsubscribe,
        getListenerEntry,
        unregisterListener,
        getScenarioMeta,
      });

      const handler = subscribe.mock.calls[0]?.[0] as (event: {
        processId: ReturnType<typeof ProcessIdStub>;
        payload: { questId?: unknown };
      }) => void;
      handler({
        processId: ProcessIdStub({ value: 'proc-no-id' }),
        payload: {},
      });

      expect(getListenerEntry.mock.calls).toStrictEqual([]);
      expect(getScenarioMeta.mock.calls).toStrictEqual([]);
    });
  });
});
