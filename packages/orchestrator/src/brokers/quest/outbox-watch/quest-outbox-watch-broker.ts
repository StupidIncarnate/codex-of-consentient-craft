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
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
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

  const outboxPath = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.eventOutbox],
  });

  if (resetOnStart) {
    await fsWriteFileAdapter({
      filePath: outboxPath,
      contents: fileContentsContract.parse(''),
    });
  } else {
    // Create-if-absent. Appending nothing makes the file exist for the tail below — `fs.watch`
    // throws on a missing path — without disturbing a byte another process has written and a
    // sibling watcher has not yet read.
    await fsAppendFileAdapter({
      filePath: outboxPath,
      contents: fileContentsContract.parse(''),
    });
  }

  const { stop } = fsWatchTailAdapter({
    filePath: outboxPath as AbsoluteFilePath,
    // Start where the file currently ends. Nothing empties the bus on a watcher's behalf any more,
    // so the adapter's default 'beginning' would re-fire `quest-modified` for every event still on
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
