import { cwd } from '#gateway/node/process';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { questOutboxWatchBrokerProxy } from '@dungeonmaster/orchestrator/brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';

import { processDevLogAdapterProxy } from '../../../adapters/process/dev-log/process-dev-log-adapter.proxy';
import { ReconcileWatchersLayerResponderProxy } from './reconcile-watchers-layer-responder.proxy';

// Fixed so a reconcile driven by this proxy never depends on the real machine's directory.
// reconcile-watchers-layer-responder resolves EVERY session belonging to a loaded quest to that
// quest's own guild path or worktree first (see its `guildPathByQuestId`/`questProjectDir`) — this
// value only ever reaches `startMonitorWatcher` as the last-resort fallback for a session with
// neither, which neither this file's tests nor reconcile-watchers-layer-responder's own colocated
// suite constructs. Fixing it here removes the real-OS-cwd leak; it does not by itself make that
// fallback branch observable — see this responder's own test for what IS proven.
const BOOTSTRAP_CWD = '/bootstrap/default-cwd';

export const QuestDrivenWatchersBootstrapResponderProxy = (): {
  outboxProxy: {
    getCapturedResetOnStart: () => boolean | undefined;
  };
  getCwdCalls: () => RecordedCalls;
} => {
  // Neither test in this file's own colocated .test.ts reaches into the dev-log or layer wiring
  // directly — creating each child proxy here registers its mock (and, for the layer proxy,
  // StartOrchestratorProxy's own listGuilds default of an empty list) so the responder's real
  // calls resolve instead of hitting an unmatched-call throw.
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  cwdHandle.calledWith([]).returns(BOOTSTRAP_CWD);
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
    getCwdCalls: (): RecordedCalls => cwdHandle.callsMatching([]),
  };
};
