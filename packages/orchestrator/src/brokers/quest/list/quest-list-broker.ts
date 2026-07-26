/**
 * PURPOSE: Loads all loadable quests from a guild's quests directory
 *
 * USAGE:
 * await questListBroker({guildId: GuildIdStub()});
 * // Returns array of Quest objects from quest folders (e.g., 001-add-auth/quest.json)
 *
 * FAULT ISOLATION: a quest file that fails to read or fails questContract is SKIPPED, not
 * thrown. This is the guild-wide enumeration every orchestration surface reads through —
 * questActiveQuestsBroker (the dispatcher's active-quest scan AND the /queue list), the play
 * gate, orphan reset, work-item/session lookup. Throwing on one bad file removes every OTHER
 * quest in the guild from all of them, which strands an in_progress quest with the dispatcher
 * permanently idle. Each skip is written to stderr naming the file and the rejected field, so a
 * dropped quest is never silent.
 *
 * SKIP REPORTS ARE DEDUPED per quest file, for the process lifetime. Nothing caches the quests
 * themselves — quest.json mutates constantly, so every caller MUST re-read and re-parse, and the
 * timer-driven callers (the watcher reconcile's 3s poll, the dispatch loop, the play gate) reach
 * this broker many times a minute. An unchanged bad file therefore fails identically on every
 * pass; re-reporting it adds no information and buries every other line in the log (a rejected
 * quest.json produces a multi-KB zod message). `lastReportedReason` remembers what was last said
 * about each path: a NEW reason re-reports (the file changed and is still broken), and a
 * successful load forgets the path (so a file that breaks again later reports again).
 *
 * REPORTING THE SKIP: pass `onSkipped` to receive each skip as structured data (folder, quest.json
 * path, parse reason) instead of having to scrape stderr — that is how the HTTP quest list tells
 * the UI which file it dropped. Callers that omit it keep this signature and behavior unchanged.
 * `onSkipped` fires on EVERY skip, unlike the stderr line: the dedup above exists to keep the log
 * readable, while a caller building a response needs the full skip set on every call.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import type {
  ErrorMessage,
  FilePath,
  GuildId,
  Quest,
  SkippedQuestFile,
} from '@dungeonmaster/shared/contracts';
import {
  errorMessageContract,
  filePathContract,
  skippedQuestFileContract,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { isQuestFolderGuard } from '../../../guards/is-quest-folder/is-quest-folder-guard';
import { questLoadBroker } from '../load/quest-load-broker';
import { questResolveQuestsPathBroker } from '../resolve-quests-path/quest-resolve-quests-path-broker';

const lastReportedReason = new Map<FilePath, ErrorMessage>();

export const questListBroker = async ({
  guildId,
  onSkipped,
}: {
  guildId: GuildId;
  onSkipped?: (params: { skipped: SkippedQuestFile }) => void;
}): Promise<Quest[]> => {
  const { questsPath } = questResolveQuestsPathBroker({ guildId });

  const entries = fsReaddirAdapter({ dirPath: questsPath });

  const questFolders = entries.filter((folderName) => isQuestFolderGuard({ folderName }));

  const loaded = await Promise.all(
    questFolders.map(async (folderName): Promise<Quest | null> => {
      const questFilePath = pathJoinAdapter({
        paths: [questsPath, folderName, locationsStatics.quest.questFile],
      });
      const reportKey = filePathContract.parse(String(questFilePath));
      try {
        const quest = await questLoadBroker({ questFilePath });
        lastReportedReason.delete(reportKey);
        return quest;
      } catch (error: unknown) {
        // questLoadBroker's message already names the file and the rejected field.
        const reason = errorMessageContract.parse(
          error instanceof Error ? error.message : String(error),
        );
        if (lastReportedReason.get(reportKey) !== reason) {
          lastReportedReason.set(reportKey, reason);
          process.stderr.write(
            `[quest-list] skipping unloadable quest — ${reason} (repeats suppressed until this file changes)\n`,
          );
        }
        onSkipped?.({
          skipped: skippedQuestFileContract.parse({
            questFolder: folderName,
            questFilePath,
            // The path prefix is already on the stderr line; the caller gets the parse reason on
            // its own so a UI can render it without the redundant absolute path.
            reason: String(reason).replace(`Failed to parse quest file at ${questFilePath}: `, ''),
          }),
        });
        return null;
      }
    }),
  );

  return loaded.filter((quest): quest is Quest => quest !== null);
};
