/**
 * PURPOSE: Answers one already-frame-parsed `DriverRequest` — `ping` answers ok without touching the
 * lane; `run` decodes its JSON `payload` through `runRequestContract` and delegates to
 * `runExecuteBroker`; `kill` tears the lane down through `laneTeardownBroker` and marks the registry
 * row through `instanceReleaseBroker`. Takes `lane`, `instanceId`, `mintRunId` and the four buffer/
 * shot accessors (`flushCursor`/`advanceFlushCursor`/`lastShotPath`/`setLastShotPath`) as PARAMETERS
 * rather than reading `driverSessionState` itself — a broker's allowed imports do not include
 * `state/` (see `get-architecture`'s layer table), so the responder that owns the socket's request
 * loop reads the current lane and these accessors and passes them all down explicitly, and it is that
 * same caller's job to notice a `kind: 'kill'` response and stop its own idle-wait loop — this broker
 * only tears the LANE down — it has no signal to send anywhere.
 *
 * USAGE:
 * await driverHandleRequestBroker({
 *   request: DriverRequestStub({ kind: 'ping' }),
 *   instanceId: InstanceIdStub(),
 *   lane: LaneSessionStub(),
 *   mintRunId: () => RunIdStub(),
 *   flushCursor: driverSessionState.flushCursor, advanceFlushCursor: driverSessionState.advanceFlushCursor,
 *   lastShotPath: driverSessionState.lastShotPath, setLastShotPath: driverSessionState.setLastShotPath,
 * });
 * // Returns a DriverResponse — ok:true with an empty payload for a ping
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { driverResponseContract } from '../../../contracts/driver-response/driver-response-contract';
import type { DriverResponse } from '../../../contracts/driver-response/driver-response-contract';
import type { DriverRequest } from '../../../contracts/driver-request/driver-request-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { runRequestContract } from '../../../contracts/run-request/run-request-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { instanceReleaseBroker } from '../../instance/release/instance-release-broker';
import { laneTeardownBroker } from '../../lane/teardown/lane-teardown-broker';
import { runExecuteBroker } from '../../run/execute/run-execute-broker';

type PayloadParseOutcome = { success: true; value: unknown } | { success: false; error: unknown };

export const driverHandleRequestBroker = async ({
  request,
  instanceId,
  lane,
  mintRunId,
  flushCursor,
  advanceFlushCursor,
  lastShotPath,
  setLastShotPath,
}: {
  request: DriverRequest;
  instanceId: InstanceId;
  lane: LaneSession;
  mintRunId: () => RunId;
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
}): Promise<DriverResponse> => {
  if (request.kind === 'ping') {
    return driverResponseContract.parse({ ok: true, payload: '', error: null });
  }

  if (request.kind === 'run') {
    const parsedPayload: PayloadParseOutcome = ((): PayloadParseOutcome => {
      try {
        return { success: true, value: JSON.parse(request.payload) as unknown };
      } catch (error) {
        return { success: false, error };
      }
    })();

    if (!parsedPayload.success) {
      return driverResponseContract.parse({
        ok: false,
        payload: '',
        error: `Malformed run payload: ${String(parsedPayload.error)}`,
      });
    }

    const parsedRun = runRequestContract.safeParse(parsedPayload.value);
    if (!parsedRun.success) {
      return driverResponseContract.parse({
        ok: false,
        payload: '',
        error: `Malformed run payload: ${parsedRun.error.message}`,
      });
    }

    const result = await runExecuteBroker({
      lane,
      instanceId,
      runId: mintRunId(),
      steps: parsedRun.data.steps,
      stopOn: parsedRun.data.stopOn,
      flushCursor,
      advanceFlushCursor,
      lastShotPath,
      setLastShotPath,
    });

    return driverResponseContract.parse({
      ok: true,
      payload: JSON.stringify(result),
      error: null,
    });
  }

  const killResult = await laneTeardownBroker({ session: lane, instanceId });
  await instanceReleaseBroker({ instanceId });

  return driverResponseContract.parse({
    ok: true,
    payload: JSON.stringify(killResult),
    error: null,
  });
};
