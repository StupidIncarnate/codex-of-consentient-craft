/**
 * PURPOSE: Watches the quest event-outbox.jsonl file for new quest change events
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

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { fsWatchTailAdapter } from '../../../adapters/fs/watch-tail/fs-watch-tail-adapter';
import { questOutboxLineContract } from '../../../contracts/quest-outbox-line/quest-outbox-line-contract';

export const questOutboxWatchBroker = async ({
  onQuestChanged,
  onError,
}: {
  onQuestChanged: (args: { questId: QuestId }) => void;
  onError: (args: { error: unknown }) => void;
}): Promise<{ stop: () => void }> => {
  const { homePath } = await dungeonmasterHomeEnsureBroker();

  const outboxPath = pathJoinAdapter({
    paths: [homePath, locationsStatics.dungeonmasterHome.eventOutbox],
  });

  await fsWriteFileAdapter({
    filePath: outboxPath,
    contents: fileContentsContract.parse(''),
  });

  const { stop } = fsWatchTailAdapter({
    filePath: outboxPath as AbsoluteFilePath,
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
