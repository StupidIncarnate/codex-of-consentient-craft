/**
 * PURPOSE: Renders `quest.packagesAffected` as the one-line summary the agent-facing prompt blocks
 * share, so the two axes a bare name hides — what the quest DOES to a package and what KIND it is —
 * reach the session that has to act on them. Reach for this wherever a prompt names the affected
 * packages; a plain `entries.map((entry) => entry.name)` reads identically to the string list this
 * replaced and is what let `packageType` sit unread while every session re-derived it.
 *
 * USAGE:
 * questPackageEntriesToTextTransformer({ entries: quest.packagesAffected });
 * // 'web (edit, frontend-react), groundstomp (new, programmatic-service)'
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import type { QuestPackageEntryStub } from '@dungeonmaster/shared/contracts';

type QuestPackageEntry = ReturnType<typeof QuestPackageEntryStub>;

export const questPackageEntriesToTextTransformer = ({
  entries,
}: {
  entries: readonly QuestPackageEntry[];
}): ContentText =>
  contentTextContract.parse(
    entries
      .map((entry) => `${String(entry.name)} (${entry.changeType}, ${entry.packageType})`)
      .join(', '),
  );
