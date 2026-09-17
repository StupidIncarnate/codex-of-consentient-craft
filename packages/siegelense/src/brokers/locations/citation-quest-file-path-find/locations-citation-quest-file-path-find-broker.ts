/**
 * PURPOSE: Resolves the `quest.json` a citation is read out of, for the quest id `start` recorded on
 * the registry row — "`start` records the quest id in the registry entry. `prune` and `cleanup` then
 * resolve a reference by reading that quest's `.quest-plans/`" (siegelense-tooling.md lines
 * 250-252), and the quest FILE is the other half of that, because a `WALKED` record lives in
 * `quest.json` rather than in the plan directory (siege-verification-remainder.md line 731: the plan
 * directory is wiped when the quest ends and the id has to outlive it). Composes
 * `locationsQuestFolderPathFindBroker` from `@dungeonmaster/shared` rather than re-deriving the
 * guild/quests layout, so a quest folder moving moves this too. Reach for this over
 * `locationsInstanceEvidencePathFindBroker`: that one answers where an instance's OWN files are,
 * while this answers where the record that might still need them is.
 *
 * USAGE:
 * locationsCitationQuestFilePathFindBroker({ guildId, questId });
 * // Returns AbsoluteFilePath '<dmHome>/guilds/<guildId>/quests/<questId>/quest.json'
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { locationsQuestFolderPathFindBroker } from '@dungeonmaster/shared/brokers';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

export const locationsCitationQuestFilePathFindBroker = ({
  guildId,
  questId,
}: {
  guildId: GuildId;
  questId: QuestId;
}): AbsoluteFilePath => {
  const questFolder = locationsQuestFolderPathFindBroker({ guildId, questId });

  return absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [questFolder, locationsStatics.quest.questFile] }),
  );
};
