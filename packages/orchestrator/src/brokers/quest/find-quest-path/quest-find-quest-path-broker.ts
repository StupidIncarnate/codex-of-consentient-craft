/**
 * PURPOSE: Answers "which folder holds this quest, and whose guild is it" for every single-quest
 * read and write in the product — the one lookup that turns a bare `questId`, the only handle most
 * callers carry, into a path plus the `guildId` that is nowhere on the caller's side.
 *
 * USAGE:
 * const { questPath, guildId } = await questFindQuestPathBroker({ questId: QuestIdStub({ value: 'add-auth' }) });
 * // Returns: { questPath: AbsoluteFilePath, guildId: GuildId } or throws if not found
 *
 * TWO PHASES, ONE ANSWER. `questCreateBroker` names a quest's folder with the literal `questId` and
 * `guildAddBroker` names a guild's directory with the literal `guildId`, and nothing renames either
 * afterwards — so the canonical path is PROBED first, one `existsSync` per guild directory, and the
 * one file that turns up is read to confirm its `id`. Anything the probe cannot settle falls
 * through to the SCAN, which reads every quest.json in the home. The scan is what keeps two shapes
 * reachable that the probe cannot name: a legacy `NNN-name` folder (see `isQuestFolderGuard`), and
 * a quest under a guild `guildRemoveBroker` dropped from config.json without deleting its files.
 * Both phases read `guilds/` with readdir rather than through `guildListBroker`, which is what
 * keeps that second shape findable at all.
 *
 * WHY THE PROBE EARNS ITS KEEP: the scan JSON.parses every quest.json in full just to read one
 * `id`, and a real quest.json runs from kilobytes into the hundreds of kilobytes, so its cost grows
 * with everything ever left in the home — which, because `guildRemoveBroker` deletes no files, only
 * ever grows. This lookup sits inside the per-quest modify lock of every quest writer and on the
 * dispatch loop's poll, so that cost lands in the critical section of every write in the system.
 *
 * IDENTITY MATCH IS NARROW, and both phases settle it in `matchCandidatesLayerBroker` so they
 * cannot drift: a candidate is matched on `id` alone, never on the whole questContract. A folder
 * whose NAME is the quest id but whose file records a different one is therefore not a hit, and the
 * scan still runs.
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import {
  fsExistsSyncAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeStatics, locationsStatics } from '@dungeonmaster/shared/statics';
import { fileNameContract } from '@dungeonmaster/shared/contracts';
import type {
  AbsoluteFilePath,
  FileName,
  FilePath,
  GuildId,
  QuestId,
} from '@dungeonmaster/shared/contracts';

import { QuestNotFoundError } from '../../../errors/quest-not-found/quest-not-found-error';
import { isSafePathSegmentGuard } from '../../../guards/is-safe-path-segment/is-safe-path-segment-guard';
import { matchCandidatesLayerBroker } from './match-candidates-layer-broker';

export const questFindQuestPathBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ questPath: AbsoluteFilePath; guildId: GuildId }> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const guildsDir = pathJoinAdapter({
    paths: [homePath, dungeonmasterHomeStatics.paths.guildsDir],
  });

  const guildEntries = fsReaddirWithTypesAdapter({ dirPath: guildsDir as AbsoluteFilePath });
  const guildDirs = guildEntries.filter((entry) => entry.isDirectory());

  // `questId` becomes a path segment here and nowhere else in this broker, and questIdContract is
  // `z.string().min(1)` with no format rule — so an id that does not name one directory skips the
  // probe rather than being joined into a path that resolves somewhere else.
  const probeCandidates = isSafePathSegmentGuard({ segment: String(questId) })
    ? guildDirs.map((guildDir) => {
        const questFolderPath = pathJoinAdapter({
          paths: [
            guildsDir,
            guildDir.name,
            dungeonmasterHomeStatics.paths.questsDir,
            String(questId),
          ],
        });

        return {
          questFilePath: pathJoinAdapter({
            paths: [questFolderPath, locationsStatics.quest.questFile],
          }),
          questFolderPath,
          guildDirName: guildDir.name,
        };
      })
    : [];

  // `existsSync` is synchronous, so this stops at the first guild directory that holds the folder
  // and never stats a later one. Nothing is read here: one stat per GUILD replaces the scan's full
  // read-and-parse per QUEST.
  const probeHit = probeCandidates.find((candidate) =>
    fsExistsSyncAdapter({ filePath: candidate.questFilePath }),
  );

  // `guildDirName` is parsed for the ONE hit rather than for every candidate. Parsing it in the
  // map above costs a zod parse per guild directory on every lookup, including the misses that go
  // on to pay for the whole scan anyway — measurable on a home with hundreds of guilds.
  const probeMatch =
    probeHit === undefined
      ? null
      : await matchCandidatesLayerBroker({
          candidates: [
            { ...probeHit, guildDirName: fileNameContract.parse(probeHit.guildDirName) },
          ],
          questId,
        });

  if (probeMatch !== null) {
    return probeMatch;
  }

  const candidates: {
    questFilePath: FilePath;
    questFolderPath: FilePath;
    guildDirName: FileName;
  }[] = [];

  for (const guildDir of guildDirs) {
    const questsDirPath = pathJoinAdapter({
      paths: [guildsDir, guildDir.name, dungeonmasterHomeStatics.paths.questsDir],
    });

    try {
      const questFolderEntries = fsReaddirWithTypesAdapter({
        dirPath: questsDirPath as AbsoluteFilePath,
      });

      const questFolders = questFolderEntries.filter((entry) => entry.isDirectory());

      for (const questFolder of questFolders) {
        candidates.push({
          questFilePath: pathJoinAdapter({
            paths: [questsDirPath, questFolder.name, locationsStatics.quest.questFile],
          }),
          questFolderPath: pathJoinAdapter({
            paths: [questsDirPath, questFolder.name],
          }),
          guildDirName: fileNameContract.parse(guildDir.name),
        });
      }
    } catch {
      continue;
    }
  }

  const scanMatch = await matchCandidatesLayerBroker({ candidates, questId });

  if (scanMatch !== null) {
    return scanMatch;
  }

  throw new QuestNotFoundError({ questId });
};
