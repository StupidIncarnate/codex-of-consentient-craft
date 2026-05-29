import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';

import { orchestratorOutboxWatchAdapterProxy } from '../../../adapters/orchestrator/outbox-watch/orchestrator-outbox-watch-adapter.proxy';
import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { ReconcileWatchersLayerResponderProxy } from './reconcile-watchers-layer-responder.proxy';

export const QuestDrivenWatchersBootstrapResponderProxy = (): {
  cwdProxy: ReturnType<typeof processCwdAdapterProxy>;
  outboxProxy: ReturnType<typeof orchestratorOutboxWatchAdapterProxy>;
  devLogProxy: ReturnType<typeof processDevLogAdapterProxy>;
  layerProxy: ReturnType<typeof ReconcileWatchersLayerResponderProxy>;
} => ({
  cwdProxy: processCwdAdapterProxy(),
  outboxProxy: orchestratorOutboxWatchAdapterProxy(),
  devLogProxy: processDevLogAdapterProxy(),
  layerProxy: ReconcileWatchersLayerResponderProxy(),
});
