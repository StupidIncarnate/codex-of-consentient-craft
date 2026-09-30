/**
 * PURPOSE: A quest id alone does not say which dungeonmaster home wrote it. Dogfood prod, dogfood
 * dev, an env override, and the end-user global home can each hold a `quest.json` under the same
 * id. This broker searches every candidate, in the fixed CLAUDE.md precedence: repo-local prod,
 * repo-local dev, DUNGEONMASTER_HOME, then user-global. That order makes sure a live dogfood run
 * gets measured, not a stale copy the user-global home also happens to carry.
 *
 * USAGE:
 * questFindBroker({ questId: QuestIdStub() });
 * // Returns the AbsoluteFilePath to that quest's quest.json. Returns undefined when no candidate
 * // root holds it.
 */
import { existsSync, readdirEntriesSync } from '#gateway/node/fs';
import { cwd } from '#gateway/node/process';
import { join } from '#gateway/node/path';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

export const questFindBroker = ({
  questId,
}: {
  questId: Quest['id'];
}): AbsoluteFilePath | undefined => {
  const { homePath: fallbackHomePath } = dungeonmasterHomeFindBroker();
  const currentDir = cwd();

  const candidateRoots = [
    join(currentDir, locationsStatics.dungeonmasterHome.dir),
    join(currentDir, locationsStatics.repoRoot.dungeonmasterDevHome),
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
      return absoluteFilePathContract.parse(matchedPath);
    }
  }

  return undefined;
};
