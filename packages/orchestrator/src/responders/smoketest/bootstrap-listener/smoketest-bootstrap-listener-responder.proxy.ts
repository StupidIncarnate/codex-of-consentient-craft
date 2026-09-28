import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { QuestIdStub } from '@dungeonmaster/shared/contracts';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { questOutboxWatchBrokerProxy } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { smoketestPostTerminalListenerBrokerProxy } from '../../../brokers/smoketest/post-terminal-listener/smoketest-post-terminal-listener-broker.proxy';
import type { SmoketestListenerEntryStub } from '../../../contracts/smoketest-listener-entry/smoketest-listener-entry.stub';
import type { SmoketestScenarioMetaStub } from '../../../contracts/smoketest-scenario-meta/smoketest-scenario-meta.stub';
import { smoketestListenerState } from '../../../state/smoketest-listener/smoketest-listener-state';
import { smoketestListenerStateProxy } from '../../../state/smoketest-listener/smoketest-listener-state.proxy';
import { smoketestScenarioMetaState } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state';
import { smoketestScenarioMetaStateProxy } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state.proxy';
import { DrainListenerLayerResponderProxy } from './drain-listener-layer-responder.proxy';

type QuestId = ReturnType<typeof QuestIdStub>;
type ListenerEntry = ReturnType<typeof SmoketestListenerEntryStub>;
type ScenarioMeta = ReturnType<typeof SmoketestScenarioMetaStub>;

export const SmoketestBootstrapListenerResponderProxy = (): {
  reset: () => void;
  // The outbox line a real questOutboxWatchBroker install would tail — see
  // questOutboxWatchBrokerProxy.setupLines/triggerChange.
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
  // processTerminalEventLayerBroker is mocked two layers down; this proves the real install
  // wiring dispatches it, without driving that layer's own real fs/state chain (its own test
  // owns that).
  setupProcessSucceeds: () => void;
  getProcessCallArgs: () => RecordedCalls;
  // A registered listener + scenario meta is what makes createTerminalHandlerLayerBroker's
  // handler dispatch at all — real state, not an I/O boundary.
  registerListener: (params: {
    questId: QuestId;
    entry: ListenerEntry;
    scenarioMeta: ScenarioMeta;
  }) => void;
} => {
  const terminalListenerProxy = smoketestPostTerminalListenerBrokerProxy();
  const outboxProxy = questOutboxWatchBrokerProxy();
  const listenerProxy = smoketestListenerStateProxy();
  const metaProxy = smoketestScenarioMetaStateProxy();
  DrainListenerLayerResponderProxy();

  outboxProxy.setupOutboxPath({
    homeDir: '/tmp/smoketest-bootstrap-listener-test',
    homePath: FilePathStub({ value: '/tmp/smoketest-bootstrap-listener-test' }),
    outboxPath: FilePathStub({
      value: '/tmp/smoketest-bootstrap-listener-test/event-outbox.jsonl',
    }),
  });
  listenerProxy.setupEmpty();
  metaProxy.setupEmpty();

  return {
    reset: (): void => {
      outboxProxy.setupOutboxPath({
        homeDir: '/tmp/smoketest-bootstrap-listener-test',
        homePath: FilePathStub({ value: '/tmp/smoketest-bootstrap-listener-test' }),
        outboxPath: FilePathStub({
          value: '/tmp/smoketest-bootstrap-listener-test/event-outbox.jsonl',
        }),
      });
      listenerProxy.setupEmpty();
      metaProxy.setupEmpty();
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      outboxProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      outboxProxy.triggerChange();
    },
    setupProcessSucceeds: (): void => {
      terminalListenerProxy.setupProcessSucceeds();
    },
    getProcessCallArgs: (): RecordedCalls => terminalListenerProxy.getProcessCallArgs(),
    registerListener: ({
      questId,
      entry,
      scenarioMeta,
    }: {
      questId: QuestId;
      entry: ListenerEntry;
      scenarioMeta: ScenarioMeta;
    }): void => {
      smoketestListenerState.register({ questId, entry });
      smoketestScenarioMetaState.register({ questId, meta: scenarioMeta });
    },
  };
};
