import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { questOutboxWatchBrokerProxy } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { smoketestPostTerminalListenerBrokerProxy } from '../../../brokers/smoketest/post-terminal-listener/smoketest-post-terminal-listener-broker.proxy';
import { smoketestListenerStateProxy } from '../../../state/smoketest-listener/smoketest-listener-state.proxy';
import { smoketestScenarioMetaStateProxy } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state.proxy';
import { DrainListenerLayerResponderProxy } from './drain-listener-layer-responder.proxy';

export const SmoketestBootstrapListenerResponderProxy = (): {
  reset: () => void;
} => {
  smoketestPostTerminalListenerBrokerProxy();
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
  };
};
