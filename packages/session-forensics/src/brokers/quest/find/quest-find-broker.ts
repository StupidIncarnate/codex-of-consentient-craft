/**
 * PURPOSE: A quest id alone doesn't say which dungeonmaster home wrote it — dogfood prod, dogfood
 * dev, an env override, and the end-user global home are all candidates, and more than one can hold
 * a `quest.json` under the same id. Searches every candidate in the fixed CLAUDE.md precedence
 * (repo-local prod, repo-local dev, DUNGEONMASTER_HOME, user-global) so a live dogfood run is what
 * gets measured instead of a stale copy the user-global home happens to also carry.
 *
 * USAGE:
 * questFindBroker({ questId: QuestIdStub() });
 * // Returns the AbsoluteFilePath to that quest's quest.json, or undefined when no candidate root holds it
 */
import {
  processCwdAdapter,
  pathJoinAdapter,
  fsExistsSyncAdapter,
  fsReaddirWithTypesAdapter,
} from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const questFindBroker = ({
  questId,
}: {
  questId: QuestId;
}): AbsoluteFilePath | undefined => {
  const { homePath: fallbackHomePath } = dungeonmasterHomeFindBroker();
  const cwd = processCwdAdapter();

  const candidateRoots = [
    pathJoinAdapter({ paths: [cwd, locationsStatics.dungeonmasterHome.dir] }),
    pathJoinAdapter({ paths: [cwd, locationsStatics.repoRoot.dungeonmasterDevHome] }),
    fallbackHomePath,
  ];

  for (const rootPath of candidateRoots) {
    const guildsPath = pathJoinAdapter({
      paths: [rootPath, locationsStatics.dungeonmasterHome.guildsDir],
    });

    if (!fsExistsSyncAdapter({ filePath: guildsPath })) {
      continue;
    }

    const guildEntries = fsReaddirWithTypesAdapter({
      dirPath: absoluteFilePathContract.parse(guildsPath),
    });

    const candidatePaths = guildEntries.map((entry) =>
      pathJoinAdapter({
        paths: [
          guildsPath,
          entry.name,
          locationsStatics.guild.questsDir,
          questId,
          locationsStatics.quest.questFile,
        ],
      }),
    );

    const matchedPath = candidatePaths.find((candidate) =>
      fsExistsSyncAdapter({ filePath: candidate }),
    );

    if (matchedPath !== undefined) {
      return absoluteFilePathContract.parse(matchedPath);
    }
  }

  return undefined;
};
