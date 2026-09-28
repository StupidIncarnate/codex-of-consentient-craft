/**
 * PURPOSE: Tails the quest event-outbox.jsonl — the CROSS-PROCESS quest event bus — and fires one
 * callback per appended line. It is a READER: several bootstraps in several processes watch this one
 * file at the same time, so it leaves the bytes alone. `resetOnStart` is the single exception and
 * belongs to exactly one caller; see the parameter for who and why.
 *
 * USAGE:
 * const { stop } = await questOutboxWatchBroker({
 *   onQuestChanged: ({ questId }) => dispatchUpdate({ questId }),
 *   onError: ({ error }) => logError({ error }),
 * });
 * // later:
 * stop();
 */

import { dungeonmasterHomeEnsureBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { tailFile } from '#gateway/node/fs';
import { appendFile, writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { questOutboxLineContract } from '../../../contracts/quest-outbox-line/quest-outbox-line-contract';

export const questOutboxWatchBroker = async ({
  onQuestChanged,
  onError,
  resetOnStart = false,
}: {
  onQuestChanged: (args: { questId: QuestId }) => void;
  onError: (args: { error: unknown }) => void;
  // TRUE on exactly ONE caller — `QuestDrivenWatchersBootstrapResponder`, which `StartServer` runs
  // once per HTTP server boot and which no MCP child ever reaches. Emptying the outbox there is the
  // only thing bounding the file's growth: nothing else rotates or trims it. A second `true`
  // truncates a bus whose other watchers are already positioned inside it, which destroys every
  // line they have not read and leaves their offsets past the new end of the file.
  resetOnStart?: boolean;
}): Promise<{ stop: () => void }> => {
  const { homePath } = await dungeonmasterHomeEnsureBroker();

  const outboxPath = filePathContract.parse(
    join(homePath, locationsStatics.dungeonmasterHome.eventOutbox),
  );

  if (resetOnStart) {
    await writeFile(outboxPath, '');
  } else {
    // Create-if-absent. Appending nothing makes the file exist for the tail below — `fs.watch`
    // throws on a missing path — without disturbing a byte another process has written and a
    // sibling watcher has not yet read.
    await appendFile(outboxPath, '');
  }

  const { stop } = tailFile({
    path: outboxPath,
    // Start where the file currently ends. Nothing empties the bus on a watcher's behalf any more,
    // so the tail's default 'beginning' would re-fire `quest-modified` for every event still on
    // disk each time a watcher starts.
    startPosition: 'end',
    onLine: ({ line }) => {
      try {
        const parsed = questOutboxLineContract.safeParse(JSON.parse(line));

        if (parsed.success) {
          onQuestChanged({ questId: parsed.data.questId });
        } else {
          onError({ error: parsed.error });
        }
      } catch (parseError) {
        onError({ error: parseError });
      }
    },
    onError,
  });

  return { stop };
};
