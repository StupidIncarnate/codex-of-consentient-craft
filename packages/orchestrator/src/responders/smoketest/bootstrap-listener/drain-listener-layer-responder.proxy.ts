import { smoketestListenerStateProxy } from '../../../state/smoketest-listener/smoketest-listener-state.proxy';
import { smoketestRunStateProxy } from '../../../state/smoketest-run/smoketest-run-state.proxy';
import { smoketestScenarioMetaStateProxy } from '../../../state/smoketest-scenario-meta/smoketest-scenario-meta-state.proxy';

export const DrainListenerLayerResponderProxy = (): {
  reset: () => void;
} => {
  const listenerProxy = smoketestListenerStateProxy();
  const metaProxy = smoketestScenarioMetaStateProxy();
  const runProxy = smoketestRunStateProxy();

  listenerProxy.setupEmpty();
  metaProxy.setupEmpty();
  runProxy.setupEmpty();

  return {
    reset: (): void => {
      listenerProxy.setupEmpty();
      metaProxy.setupEmpty();
      runProxy.setupEmpty();
    },
  };
};
