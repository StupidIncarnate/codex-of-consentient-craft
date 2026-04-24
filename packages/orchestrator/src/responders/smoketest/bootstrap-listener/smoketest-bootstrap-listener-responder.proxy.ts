import { smoketestPostTerminalListenerBrokerProxy } from '../../../brokers/smoketest/post-terminal-listener/smoketest-post-terminal-listener-broker.proxy';
import { orchestrationEventsStateProxy } from '../../../state/orchestration-events/orchestration-events-state.proxy';
import { smoketestListenerStateProxy } from '../../../state/smoketest-listener/smoketest-listener-state.proxy';
import { smoketestRunStateProxy } from '../../../state/smoketest-run/smoketest-run-state.proxy';
import { smoketestScenarioMetaStateProxy } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state.proxy';

export const SmoketestBootstrapListenerResponderProxy = (): {
  reset: () => void;
} => {
  smoketestPostTerminalListenerBrokerProxy();
  const eventsProxy = orchestrationEventsStateProxy();
  const listenerProxy = smoketestListenerStateProxy();
  const metaProxy = smoketestScenarioMetaStateProxy();
  smoketestRunStateProxy();

  eventsProxy.setupEmpty();
  listenerProxy.setupEmpty();
  metaProxy.setupEmpty();

  return {
    reset: (): void => {
      eventsProxy.setupEmpty();
      listenerProxy.setupEmpty();
      metaProxy.setupEmpty();
    },
  };
};
