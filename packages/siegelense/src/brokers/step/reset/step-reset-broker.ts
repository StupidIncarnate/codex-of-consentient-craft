/**
 * PURPOSE: Drives the `reset` step verb — resets state across the requested level ('page',
 * 'state', 'instance'), clearing what the level declares, keeping what it preserves, and reporting
 * the undid diff.
 *
 * `level: 'page'` clears browser storage and requires a live browser session (refusing on headless
 * with BrowserStepUnsupportedError).
 * `level: 'state'` rewinds disk files to a named snapshot and clears browser storage if present,
 * running identically browserless.
 * `level: 'instance'` resets process/disk state and optionally reseeds with a recipe.
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

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { recipeNameContract } from '@dungeonmaster/siegelense-recipes/contracts';

import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { ResetLevel } from '../../../contracts/reset-level/reset-level-contract';
import { resetReadingContract } from '../../../contracts/reset-reading/reset-reading-contract';
import type { ResetUndid } from '../../../contracts/reset-undid/reset-undid-contract';
import type { SnapshotName } from '../../../contracts/snapshot-name/snapshot-name-contract';
import { BrowserStepUnsupportedError } from '../../../errors/browser-step-unsupported/browser-step-unsupported-error';
import { resetStatics } from '../../../statics/reset/reset-statics';
import { resetReadingRenderTransformer } from '../../../transformers/reset-reading-render/reset-reading-render-transformer';
import { recipeSeedRunBroker } from '../../recipe/seed-run/recipe-seed-run-broker';
import { snapshotResolveBroker } from '../../snapshot/resolve/snapshot-resolve-broker';
import { snapshotRestoreLayerBroker } from './snapshot-restore-layer-broker';

export const stepResetBroker = async ({
  lane,
  level,
  to,
  reseed,
}: {
  lane: LaneSession;
  level: ResetLevel;
  to: SnapshotName | null;
  reseed: ContentText | null;
}): Promise<ContentText> => {
  const zeroUndid: ResetUndid = {
    files: readingCountContract.parse(0),
    added: readingCountContract.parse(0),
    modified: readingCountContract.parse(0),
    removed: readingCountContract.parse(0),
  };

  const notCleared: readonly ContentText[] =
    level === 'page'
      ? resetStatics.notCleared.page.map((item) => contentTextContract.parse(item))
      : level === 'state'
        ? resetStatics.notCleared.state.map((item) => contentTextContract.parse(item))
        : [];

  if (level === 'page') {
    if (lane.browser === null) {
      throw new BrowserStepUnsupportedError({
        verb: 'reset',
        specName: String(lane.specName),
        form: 'page',
      });
    }
    await lane.browser.clearStorage();

    const reading = resetReadingContract.parse({
      restored: contentTextContract.parse('page'),
      undid: zeroUndid,
      NOT_cleared: notCleared,
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
    if (lane.browser !== null) {
      await lane.browser.clearStorage();
    }

    const reading = resetReadingContract.parse({
      restored: contentTextContract.parse(to),
      undid,
      NOT_cleared: notCleared,
    });
    return resetReadingRenderTransformer({ reading });
  }

  // level === 'instance'
  if (lane.browser !== null) {
    await lane.browser.clearStorage();
  }

  const undid =
    to === null
      ? zeroUndid
      : await snapshotRestoreLayerBroker({
          homePath: lane.homePath,
          payloadPath: (await snapshotResolveBroker({ homePath: lane.homePath, name: to })).path,
        });

  if (reseed !== null) {
    await recipeSeedRunBroker({
      recipe: recipeNameContract.parse(reseed),
      apiBaseUrl: lane.apiBaseUrl,
      homePath: lane.homePath,
      parameters: {},
    });
  }

  let restored: ContentText = contentTextContract.parse('instance');
  if (to !== null) {
    restored = contentTextContract.parse(to);
  } else if (reseed !== null) {
    restored = reseed;
  }

  const reading = resetReadingContract.parse({
    restored,
    undid,
    NOT_cleared: notCleared,
  });

  return resetReadingRenderTransformer({ reading });
};
