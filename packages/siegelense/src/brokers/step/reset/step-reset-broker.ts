/**
 * PURPOSE: Drives the `reset` step verb — resets state across the requested level ('page',
 * 'state', 'instance'), clearing what the level declares, keeping what it preserves, and reporting
 * the undid diff.
 *
 * `level: 'page'` clears browser storage and requires a live browser session (refusing on headless
 * with BrowserStepUnsupportedError).
 * `level: 'state'` rewinds disk files to a named snapshot and clears browser storage if present,
 * running identically browserless.
 * `level: 'instance'` restarts the lane: it stops every server process group and waits for each to
 * exit, rewinds disk while nothing is running — to the named `to` snapshot, or with no `to` to the
 * instance's BOOT state, the earliest record in the snapshot index (`run-execute-broker` captures
 * `run_N:start` before a run's first step, so the first run's capture IS the disk `start` left, and
 * the index is append-only) — respawns every process on the same ports, home, env and args, reloads
 * the browser page to the lane's web base URL and clears its storage, then reseeds. Server memory
 * and open websockets are gone afterwards. The restart touches only the lane's own child processes;
 * the CLI's socket to this driver, which dispatched the batch, stays open throughout.
 *
 * Every browser storage clear goes through `resetClearStorageLayerBroker` rather than
 * `lane.browser.clearStorage()` directly (DEF-94): a `reset` step may be the FIRST step of a fresh
 * instance's first run, whose page is still `about:blank` — no origin for `localStorage`/
 * `sessionStorage` to scope to, so Playwright throws a SecurityError instead of clearing anything.
 * That one failure is tolerated and reported by NAME, appended to `NOT_cleared` alongside whatever
 * the level's own static list already carries, rather than crashing the whole step.
 *
 * USAGE:
 * await stepResetBroker({
 *   lane,
 *   level: ResetLevelStub({ value: 'state' }),
 *   to: 'clean',
 *   reseed: null,
 * });
 * // Rewinds disk, clears storage, and returns formatted ResetReading as ContentText
 */

import { environmentStatics } from '@dungeonmaster/shared/statics';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import type { ResetLevel } from '../../../contracts/reset-level/reset-level-contract';
import { resetReadingContract } from '../../../contracts/reset-reading/reset-reading-contract';
import type { ResetUndid } from '../../../contracts/reset-undid/reset-undid-contract';
import { BrowserStepUnsupportedError } from '../../../errors/browser-step-unsupported/browser-step-unsupported-error';
import { resetStatics } from '../../../statics/reset/reset-statics';
import { resetReadingRenderTransformer } from '../../../transformers/reset-reading-render/reset-reading-render-transformer';
import { recipeSeedRunBroker } from '../../recipe/seed-run/recipe-seed-run-broker';
import { snapshotIndexReadBroker } from '../../snapshot/index-read/snapshot-index-read-broker';
import { snapshotResolveBroker } from '../../snapshot/resolve/snapshot-resolve-broker';
import { resetClearStorageLayerBroker } from './reset-clear-storage-layer-broker';
import { snapshotRestoreLayerBroker } from './snapshot-restore-layer-broker';
import { resetUndidContract } from '../../../contracts/reset-undid/reset-undid-contract';

export const stepResetBroker = async ({
  lane,
  level,
  to,
  reseed,
}: {
  lane: LaneSession;
  level: ResetLevel;
  to: string | null;
  reseed: string | null;
}): Promise<string> => {
  const zeroUndid: ResetUndid = resetUndidContract.parse({
    files: 0,
    added: 0,
    modified: 0,
    removed: 0,
  });

  const notCleared: readonly string[] =
    level === 'page'
      ? resetStatics.notCleared.page.map((item) => item)
      : level === 'state'
        ? resetStatics.notCleared.state.map((item) => item)
        : resetStatics.notCleared.instance.map((item) => item);

  if (level === 'page') {
    if (lane.browser === null) {
      throw new BrowserStepUnsupportedError({
        verb: 'reset',
        specName: String(lane.specName),
        form: 'page',
      });
    }
    const { cleared } = await resetClearStorageLayerBroker({ browser: lane.browser });

    const reading = resetReadingContract.parse({
      restored: 'page',
      undid: zeroUndid,
      NOT_cleared: cleared ? notCleared : [...notCleared, resetStatics.storageSkipped.noOrigin],
    });
    return resetReadingRenderTransformer({ reading });
  }

  if (level === 'state') {
    if (to === null) {
      throw new Error('a reset step with level "state" requires an explicit "to" snapshot name');
    }
    const record = await snapshotResolveBroker({
      homePath: lane.homePath,
      name: to,
    });
    const undid = await snapshotRestoreLayerBroker({
      homePath: lane.homePath,
      payloadPath: record.path,
    });
    let storageCleared = true;
    if (lane.browser !== null) {
      ({ cleared: storageCleared } = await resetClearStorageLayerBroker({ browser: lane.browser }));
    }

    const reading = resetReadingContract.parse({
      restored: to,
      undid,
      NOT_cleared: storageCleared
        ? notCleared
        : [...notCleared, resetStatics.storageSkipped.noOrigin],
    });
    return resetReadingRenderTransformer({ reading });
  }

  // level === 'instance': stop every server process, restore disk while nothing is running, then
  // respawn. The respawn runs in `finally` so a failed restore never leaves the lane with no
  // servers; a respawn that fails throws `LaneRestartFailedError` naming the process and its log.
  // The page leaves the app first: an app page left open retries its socket and its fetches
  // against the stopped servers, and every failed retry lands in the console, where the next
  // `health` reading counts it against an app that is fine.
  if (lane.browser !== null) {
    await lane.browser.goto({ url: resetStatics.blankPageUrl });
  }
  await lane.stopProcesses();

  let undid = zeroUndid;
  try {
    if (to === null) {
      // No explicit target: rewind to the instance's BOOT state — the earliest capture on record.
      const records = await snapshotIndexReadBroker({ homePath: lane.homePath });
      const [bootRecord] = records;
      if (bootRecord !== undefined) {
        undid = await snapshotRestoreLayerBroker({
          homePath: lane.homePath,
          payloadPath: bootRecord.path,
        });
      }
    } else {
      const record = await snapshotResolveBroker({ homePath: lane.homePath, name: to });
      undid = await snapshotRestoreLayerBroker({
        homePath: lane.homePath,
        payloadPath: record.path,
      });
    }
  } finally {
    await lane.startProcesses();
  }

  // Load the web base URL first so storage has an origin to clear, then load it again so the app
  // boots against empty storage and a fresh socket.
  let instanceStorageCleared = true;
  if (lane.browser !== null) {
    const webBaseUrl = `http://${environmentStatics.hostname}:${String(lane.ports.web)}`;
    await lane.browser.goto({ url: webBaseUrl });
    ({ cleared: instanceStorageCleared } = await resetClearStorageLayerBroker({
      browser: lane.browser,
    }));
    await lane.browser.goto({ url: webBaseUrl });
  }

  const reseedBindings =
    reseed === null
      ? null
      : await recipeSeedRunBroker({
          recipe: reseed,
          apiBaseUrl: lane.apiBaseUrl,
          homePath: lane.homePath,
          parameters: {},
          repoRoot: lane.repoRoot,
        });

  const restored: string = to === null ? 'instance' : to;

  const reading = resetReadingContract.parse({
    restored,
    undid,
    NOT_cleared: instanceStorageCleared
      ? notCleared
      : [...notCleared, resetStatics.storageSkipped.noOrigin],
    ...(reseed === null || reseedBindings === null
      ? {}
      : { reseeded: reseed, bindings: reseedBindings }),
  });

  return resetReadingRenderTransformer({ reading });
};
