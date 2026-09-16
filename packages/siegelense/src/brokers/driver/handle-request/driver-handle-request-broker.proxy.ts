/**
 * PURPOSE: Composes the three child broker proxies driverHandleRequestBroker dispatches to — run,
 * kill and their supporting registry update — behind semantic setup for each of the two non-ping
 * request kinds, so a test never chains through a child proxy directly. Decodes a response payload
 * through the matching STUB rather than the raw contract — proxies may not import contract files —
 * spreading the already-valid decoded object as the stub's own props re-validates it through the
 * same contract the stub itself parses with.
 *
 * USAGE:
 * const proxy = driverHandleRequestBrokerProxy();
 * const lane = proxy.laneForRun();
 * proxy.stageRunSucceeds({ runId });
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { LaneSessionStub } from '../../../contracts/lane-session/lane-session.stub';
import { KillResultStub } from '../../../contracts/kill-result/kill-result.stub';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { RegistryStub } from '../../../contracts/registry/registry.stub';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { RunResultStub } from '../../../contracts/run-result/run-result.stub';
import { instanceReleaseBrokerProxy } from '../../instance/release/instance-release-broker.proxy';
import { laneTeardownBrokerProxy } from '../../lane/teardown/lane-teardown-broker.proxy';
import { runExecuteBrokerProxy } from '../../run/execute/run-execute-broker.proxy';

const KILL_LANE_PGID = ProcessGroupIdStub({ value: 4821 });

export const driverHandleRequestBrokerProxy = (): {
  laneForRun: () => LaneSession;
  stageRunSucceeds: (params: { runId: RunId }) => void;
  laneForKill: (params: { homePath: AbsoluteFilePath }) => LaneSession;
  stageKillSucceeds: (params: { homePath: AbsoluteFilePath; registryJson: string }) => void;
  getReleasedRegistry: () => ReturnType<typeof RegistryStub>;
  decodeRunResult: (params: { payload: string }) => ReturnType<typeof RunResultStub>;
  decodeKillResult: (params: { payload: string }) => ReturnType<typeof KillResultStub>;
  flushCursor: () => {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  };
  advanceFlushCursor: (params: {
    consoleLines: ReadingCount;
    networkLines: ReadingCount;
    websocketLines: ReadingCount;
  }) => void;
  lastShotPath: () => AbsoluteFilePath | null;
  setLastShotPath: (params: { path: AbsoluteFilePath }) => void;
} => {
  const runExecuteProxy = runExecuteBrokerProxy();
  const laneTeardownProxy = laneTeardownBrokerProxy();
  const instanceReleaseProxy = instanceReleaseBrokerProxy();

  return {
    laneForRun: (): LaneSession => runExecuteProxy.cleanLane(),

    flushCursor: runExecuteProxy.flushCursor,
    advanceFlushCursor: runExecuteProxy.advanceFlushCursor,
    lastShotPath: runExecuteProxy.lastShotPath,
    setLastShotPath: runExecuteProxy.setLastShotPath,

    stageRunSucceeds: ({ runId }: { runId: RunId }): void => {
      runExecuteProxy.stagePaths({ runId });
    },

    laneForKill: ({ homePath }: { homePath: AbsoluteFilePath }): LaneSession =>
      LaneSessionStub({
        evidencePath: laneTeardownProxy.getEvidencePath(),
        homePath,
        pgids: [KILL_LANE_PGID],
      }),

    stageKillSucceeds: ({
      homePath,
      registryJson,
    }: {
      homePath: AbsoluteFilePath;
      registryJson: string;
    }): void => {
      laneTeardownProxy.setupAlreadyGoneGroup({ pgid: KILL_LANE_PGID });
      laneTeardownProxy.setupHomeRemoved({ homePath });
      laneTeardownProxy.setupEvidenceResolved();
      instanceReleaseProxy.setupCurrentRegistry({ json: registryJson });
    },

    getReleasedRegistry: (): ReturnType<typeof RegistryStub> => {
      const written = instanceReleaseProxy.getWrittenRegistry();
      return RegistryStub(written as never);
    },

    decodeRunResult: ({ payload }: { payload: string }): ReturnType<typeof RunResultStub> =>
      RunResultStub(JSON.parse(payload) as never),

    decodeKillResult: ({ payload }: { payload: string }): ReturnType<typeof KillResultStub> =>
      KillResultStub(JSON.parse(payload) as never),
  };
};
