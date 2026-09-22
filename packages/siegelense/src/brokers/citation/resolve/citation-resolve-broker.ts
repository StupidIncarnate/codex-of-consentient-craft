/**
 * PURPOSE: Answers whether one instance's evidence may be taken, and is the reason `prune` is not
 * `rm` with extra steps. The entry point is the quest id `start` recorded on the registry row
 * (siegelense-tooling.md lines 250-252): no quest means nothing cites this instance and it ages out
 * on the ordinary window, which is the `unowned` case working as intended rather than falling
 * through (line 2438). THREE outcomes, not two — `references` is a refusal a caller can explain,
 * `blocked` is a refusal it cannot yet explain but must still make, and `gaps` names every citation
 * KIND that was never checked, so an empty `references` can never be read as "nothing cites any of
 * this". `open-issue` is a permanent gap today: nothing in this repo stores an issue with a typed
 * `instanceId`/`runId` for a resolver to match — `signoffContract` carries neither and
 * `questNoteKindContract` has no `issue` member — so a walker's defect lives as a failing test on
 * disk or as prose in a note. Reach for this over calling a layer directly: this is the one place
 * that loads the quest record, and two callers loading it separately could disagree about whether
 * the quest is still open.
 *
 * USAGE:
 * await citationResolveBroker({ entry, runIds });
 * // Returns { references, gaps, blocked } — take the evidence only when references is empty AND blocked is null
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { citationGapContract } from '../../../contracts/citation-gap/citation-gap-contract';
import { citationKindContract } from '../../../contracts/citation-kind/citation-kind-contract';
import { citationResolutionContract } from '../../../contracts/citation-resolution/citation-resolution-contract';
import type { CitationResolution } from '../../../contracts/citation-resolution/citation-resolution-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { locationsCitationQuestFilePathFindBroker } from '../../locations/citation-quest-file-path-find/locations-citation-quest-file-path-find-broker';
import { questRecordParseLayerBroker } from './quest-record-parse-layer-broker';
import { unjudgedScreencastLayerBroker } from './unjudged-screencast-layer-broker';
import { verifiedPreludeLayerBroker } from './verified-prelude-layer-broker';
import { walkedNoteLayerBroker } from './walked-note-layer-broker';

// The gap that never closes with anything this package can write. It rides every resolution of a
// quest-owned instance, and `prune`/`cleanup` carry it into their own answers, so a caller reading
// `refused: []` also reads which question was never put.
const OPEN_ISSUE_GAP = citationGapContract.parse({
  kind: citationKindContract.parse('open-issue'),
  why: contentTextContract.parse(
    'not checked: no issue record exists to check. Nothing in this repo stores an issue carrying ' +
      'a typed instanceId/runId — signoffContract has neither field and questNoteKindContract has ' +
      'no issue member — so a walker records a defect as a failing test or as prose in a note, ' +
      'neither of which a resolver can match an instance against.',
  ),
});

const NO_PRELUDE_GAP = citationGapContract.parse({
  kind: citationKindContract.parse('verified-prelude'),
  why: contentTextContract.parse(
    'not checked: the quest records no worktree, so there is no .quest-plans directory to read ' +
      'preludes out of.',
  ),
});

export const citationResolveBroker = async ({
  entry,
  runIds,
}: {
  entry: RegistryEntry;
  runIds: readonly RunId[];
}): Promise<CitationResolution> => {
  if (entry.questId === null) {
    return citationResolutionContract.parse({ references: [], gaps: [], blocked: null });
  }

  if (entry.guildId === null) {
    return citationResolutionContract.parse({
      references: [],
      gaps: [],
      blocked: contentTextContract.parse(
        `quest ${entry.questId} is recorded on ${entry.id} but no guild is, and a quest record ` +
          `resolves through its guild — refusing rather than treating an unreachable record as uncited.`,
      ),
    });
  }

  const questFilePath = locationsCitationQuestFilePathFindBroker({
    guildId: entry.guildId,
    questId: entry.questId,
  });

  const contents = await fsReadFileAdapter({ filePath: questFilePath }).catch((error: unknown) => {
    if (
      error !== null &&
      typeof error === 'object' &&
      errorIsNativeErrorAdapter({ value: error }) &&
      'cause' in error &&
      error.cause !== null &&
      typeof error.cause === 'object' &&
      errorIsNativeErrorAdapter({ value: error.cause }) &&
      'code' in error.cause &&
      error.cause.code === 'ENOENT'
    ) {
      return null;
    }
    throw error;
  });

  if (contents === null) {
    return citationResolutionContract.parse({
      references: [],
      gaps: [],
      blocked: contentTextContract.parse(
        `quest ${entry.questId} is recorded on ${entry.id} but no quest record exists at ` +
          `${questFilePath} — refusing rather than treating an unreadable record as uncited.`,
      ),
    });
  }

  const { quest, blocked } = questRecordParseLayerBroker({
    contents,
    questFilePath,
    instanceId: entry.id,
  });

  if (quest === null) {
    return citationResolutionContract.parse({ references: [], gaps: [], blocked });
  }

  const walked = walkedNoteLayerBroker({
    instanceId: entry.id,
    quest,
    questFilePath,
  });

  const screencasts = await unjudgedScreencastLayerBroker({
    instanceId: entry.id,
    guildId: entry.guildId,
    quest,
    questFilePath,
  });

  if (screencasts.blocked !== null) {
    return citationResolutionContract.parse({
      references: [],
      gaps: [],
      blocked: screencasts.blocked,
    });
  }

  const { worktreePath } = quest;

  if (worktreePath === undefined) {
    return citationResolutionContract.parse({
      references: [...walked, ...screencasts.references],
      gaps: [NO_PRELUDE_GAP, OPEN_ISSUE_GAP],
      blocked: null,
    });
  }

  const preludes = await verifiedPreludeLayerBroker({
    instanceId: entry.id,
    worktreePath,
    runIds,
  });

  return citationResolutionContract.parse({
    references: [...walked, ...screencasts.references, ...preludes],
    gaps: [OPEN_ISSUE_GAP],
    blocked: null,
  });
};
