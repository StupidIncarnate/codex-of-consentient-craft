/**
 * PURPOSE: Layer of `quest-find-quest-path-broker` — reads a set of candidate quest files and
 * hands back the first whose recorded `id` is the one being looked for. Both of that broker's
 * phases settle their answer through this one place, so the probe and the full scan cannot come to
 * disagree about what counts as a match.
 *
 * USAGE:
 * const match = await matchCandidatesLayerBroker({ candidates, questId });
 * // Returns: { questPath, guildId } for the first candidate whose id matches, else null
 *
 * A candidate that cannot be read, or does not hold valid JSON, or holds JSON with no usable `id`,
 * is SKIPPED rather than thrown — one unreadable file in a home full of quests must not hide every
 * other quest in it. `null` therefore means "no candidate in this set is the quest", which is a
 * question the caller answers, not a verdict that the quest does not exist.
 */

import { guildIdContract, questContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileName,
  FilePath,
  GuildId,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

// Derived from questContract so the id's own brand and validation stay in one place. Picking the
// id ALONE is load-bearing: this fronts every single-quest read and write, so validating the whole
// contract here would turn any one bad field into "the quest was deleted" for all of them and throw
// away the field-level message questLoadBroker exists to produce.
const questIdentityContract = questContract.pick({ id: true });

export const matchCandidatesLayerBroker = async ({
  candidates,
  questId,
}: {
  candidates: {
    questFilePath: FilePath;
    questFolderPath: FilePath;
    guildDirName: FileName;
  }[];
  questId: QuestId;
}): Promise<{ questPath: AbsoluteFilePath; guildId: GuildId } | null> => {
  const results = await Promise.all(
    candidates.map(async (candidate) => {
      try {
        const contents = await fsReadFileAdapter({ filePath: candidate.questFilePath });
        const parsed: unknown = JSON.parse(contents);
        const identity = questIdentityContract.safeParse(parsed);

        if (identity.success && identity.data.id === questId) {
          return {
            questPath: candidate.questFolderPath as AbsoluteFilePath,
            guildId: guildIdContract.parse(candidate.guildDirName),
          };
        }

        return null;
      } catch {
        return null;
      }
    }),
  );

  return results.find((result) => result !== null) ?? null;
};
