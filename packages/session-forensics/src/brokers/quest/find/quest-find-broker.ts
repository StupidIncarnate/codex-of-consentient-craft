/**
 * PURPOSE: A quest id alone does not say which dungeonmaster home wrote it. Dogfood prod, dogfood
 * dev, an env override, and the end-user global home can each hold a `quest.json` under the same
 * id. This broker searches every candidate, in the fixed CLAUDE.md precedence: repo-local prod,
 * repo-local dev, DUNGEONMASTER_HOME, then user-global. That order makes sure a live dogfood run
 * gets measured, not a stale copy the user-global home also happens to carry.
 *
 * USAGE:
 * await questFindBroker({ questId: QuestIdStub(), startDir: '/path/to/repo' });
 * // startDir is where the caller runs; the repo-local roots are found by walking up from it.
 * // Returns the AbsoluteFilePath to that quest's quest.json. Returns undefined when no candidate
 * // root holds it.
 */
import { existsSync, readdirEntriesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { cwdResolveBroker, dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { ProjectRootNotFoundError } from '@dungeonmaster/shared/errors';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { Quest } from '@dungeonmaster/shared/contracts';

export const questFindBroker = async ({
  questId,
  startDir,
}: {
  questId: Quest['id'];
  startDir: string;
}): Promise<string | undefined> => {
  const { homePath: fallbackHomePath } = dungeonmasterHomeFindBroker();

  const repoRoot = await cwdResolveBroker({ startPath: startDir, kind: 'repo-root' }).catch(
    (error: unknown): undefined => {
      if (error instanceof ProjectRootNotFoundError) {
        return undefined;
      }
      throw error;
    },
  );

  const candidateRoots = [
    ...(repoRoot === undefined
      ? []
      : [
          join(repoRoot, locationsStatics.dungeonmasterHome.dir),
          join(repoRoot, locationsStatics.repoRoot.dungeonmasterDevHome),
        ]),
    fallbackHomePath,
  ];

  for (const rootPath of candidateRoots) {
    const guildsPath = join(rootPath, locationsStatics.dungeonmasterHome.guildsDir);

    if (!existsSync(guildsPath)) {
      continue;
    }

    const guildEntries = readdirEntriesSync(guildsPath);

    const candidatePaths = guildEntries.map((entry) =>
      join(
        guildsPath,
        entry.name,
        locationsStatics.guild.questsDir,
        questId,
        locationsStatics.quest.questFile,
      ),
    );

    const matchedPath = candidatePaths.find((candidate) => existsSync(candidate));

    if (matchedPath !== undefined) {
      return matchedPath;
    }
  }

  return undefined;
};
