import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';

import { processStaleWatchBrokerProxy } from '../../../brokers/process/stale-watch/process-stale-watch-broker.proxy';
import type { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { processStaleWatchBootstrapStateProxy } from '../../../state/process-stale-watch-bootstrap/process-stale-watch-bootstrap-state.proxy';
import { processStaleThresholdStatics } from '../../../statics/process-stale-threshold/process-stale-threshold-statics';

type OrchestrationProcess = ReturnType<typeof OrchestrationProcessStub>;

export const ProcessStaleWatchBootstrapResponderProxy = (): {
  triggerTick: () => void;
  setupAlive: (
    params: Parameters<ReturnType<typeof processStaleWatchBrokerProxy>['setupAlive']>[0],
  ) => void;
  setupDead: (
    params: Parameters<ReturnType<typeof processStaleWatchBrokerProxy>['setupDead']>[0],
  ) => void;
  reset: () => void;
  // The one real fact a tick can produce: a `[dev] WARN stale ...` line, written directly to
  // stderr.write (not through an adapter) by the responder's own onStale callback.
  stderrLines: () => unknown;
  registerProcess: (params: { orchestrationProcess: OrchestrationProcess }) => void;
} => {
  const bootstrapState = processStaleWatchBootstrapStateProxy();
  // ProcessStaleWatchBootstrapResponder calls processStaleWatchBroker with no intervalMs
  // override, so it uses the broker's own default: processStaleThresholdStatics.tickIntervalMs.
  const watchProxy = processStaleWatchBrokerProxy({
    intervalMs: processStaleThresholdStatics.tickIntervalMs,
  });
  // The bootstrap responder reads `orchestrationProcessesState.getAll` / `getActivity` from
  // inside `processStaleWatchBroker`'s closures — real state, not an I/O boundary, so this
  // composes the state's own proxy to seed a registered process for the tick to scan.
  const processesProxy = orchestrationProcessesStateProxy();

  const stderrChild = stderrProxy();

  return {
    triggerTick: watchProxy.triggerTick,
    setupAlive: watchProxy.setupAlive,
    setupDead: watchProxy.setupDead,
    reset: (): void => {
      bootstrapState.reset();
    },
    stderrLines: (): unknown => stderrChild.getWrites().map((chunk) => [chunk]),
    registerProcess: ({
      orchestrationProcess,
    }: {
      orchestrationProcess: OrchestrationProcess;
    }): void => {
      processesProxy.setupWithProcess({ orchestrationProcess });
    },
  };
};
