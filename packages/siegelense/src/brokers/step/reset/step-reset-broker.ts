/**
 * PURPOSE: Drives the `reset` step verb — resets state across the requested level ('page',
 * 'state', 'instance'), clearing what the level declares, keeping what it preserves, and reporting
 * the undid diff.
 *
 * `level: 'page'` clears browser storage and requires a live browser session (refusing on headless
 * with BrowserStepUnsupportedError).
 * `level: 'state'` rewinds disk files to a named snapshot and clears browser storage if present,
 * running identically browserless.
 * `level: 'instance'` with an explicit `to` rewinds to that named snapshot, same mechanism as
 * `state`. With no `to` it rewinds to the instance's BOOT state instead: the earliest record in the
 * snapshot index. `run-execute-broker` always captures `run_N:start` before that run's own first
 * step dispatches (siegelense-tooling.md line 2630), so for the very first run against an instance
 * that capture IS the disk state `start` left behind — and every later capture postdates some
 * mutation — so the index's first entry (it is append-only, in capture order) is always that boot
 * state, for as long as the instance has run anything at all. An instance with no captures yet has
 * made no mutation to undo. This step runs inside a live `run` batch against the SAME driver
 * connection that dispatched it, so — unlike an operator's own `kill` then `start` — it can never
 * restart the underlying process; that is why `resetStatics.notCleared.instance` lists "server
 * memory" and "open websockets" too, exactly as `state` does.
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
 *   to: SnapshotNameStub({ value: 'clean' }),
 *   reseed: null,
 * });
 * // Rewinds disk, clears storage, and returns formatted ResetReading as ContentText
 */


import { recipeNameContract } from '../../../contracts/recipe-name/recipe-name-contract';

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
      NOT_cleared: cleared
        ? notCleared
        : [...notCleared, resetStatics.storageSkipped.noOrigin],
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

  // level === 'instance'
  let instanceStorageCleared = true;
  if (lane.browser !== null) {
    ({ cleared: instanceStorageCleared } = await resetClearStorageLayerBroker({
      browser: lane.browser,
    }));
  }

  let undid = zeroUndid;
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
    undid = await snapshotRestoreLayerBroker({ homePath: lane.homePath, payloadPath: record.path });
  }

  if (reseed !== null) {
    await recipeSeedRunBroker({
      recipe: recipeNameContract.parse(reseed),
      apiBaseUrl: lane.apiBaseUrl,
      homePath: lane.homePath,
      parameters: {},
    });
  }

  let restored: string = 'instance';
  if (to !== null) {
    restored = to;
  } else if (reseed !== null) {
    restored = reseed;
  }

  const reading = resetReadingContract.parse({
    restored,
    undid,
    NOT_cleared: instanceStorageCleared
      ? notCleared
      : [...notCleared, resetStatics.storageSkipped.noOrigin],
  });

  return resetReadingRenderTransformer({ reading });
};
