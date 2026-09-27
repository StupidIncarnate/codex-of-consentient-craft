import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { questOutboxWatchBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';

import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { ReconcileWatchersLayerResponderProxy } from './reconcile-watchers-layer-responder.proxy';

export const QuestDrivenWatchersBootstrapResponderProxy = (): {
  outboxProxy: {
    getCapturedResetOnStart: () => boolean | undefined;
  };
} => {
  // Neither test in this file's own colocated .test.ts reaches into the cwd, dev-log or layer
  // wiring directly — creating each child proxy here registers its mock (and, for the layer
  // proxy, StartOrchestratorProxy's own listGuilds default of an empty list) so the responder's
  // real calls resolve instead of hitting an unmatched-call throw.
  processCwdAdapterProxy();
  processDevLogAdapterProxy();
  ReconcileWatchersLayerResponderProxy();

  const outboxWatchProxy = questOutboxWatchBrokerProxy();
  // The REAL broker (fs-staged with an invented, self-contained path) settles the responder's
  // one call — the SAME real call the broker's own tests exercise — so its default `stop` handle
  // and `resetOnStart` capture come from the actual implementation, not a hand-rolled stand-in.
  outboxWatchProxy.setupWatchStarted();

  return {
    outboxProxy: {
      getCapturedResetOnStart: (): boolean | undefined =>
        outboxWatchProxy.getCapturedResetOnStart(),
    },
  };
};
