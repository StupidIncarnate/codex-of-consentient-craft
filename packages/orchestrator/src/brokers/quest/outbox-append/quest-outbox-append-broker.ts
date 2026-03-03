/**
 * PURPOSE: Appends a quest outbox line to the event-outbox.jsonl file in the dungeonmaster home directory
 *
 * USAGE:
 * await questOutboxAppendBroker({ questId: QuestIdStub() });
 * // Appends a JSON line with questId and timestamp to ~/.dungeonmaster/event-outbox.jsonl
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { questOutboxLineContract } from '../../../contracts/quest-outbox-line/quest-outbox-line-contract';

const OUTBOX_FILE_NAME = 'event-outbox.jsonl';

export const questOutboxAppendBroker = async ({ questId }: { questId: QuestId }): Promise<void> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const outboxFilePath = pathJoinAdapter({ paths: [homePath, OUTBOX_FILE_NAME] });

  const outboxLine = questOutboxLineContract.parse({
    questId,
    timestamp: new Date().toISOString(),
  });

  const serialized = fileContentsContract.parse(`${JSON.stringify(outboxLine)}\n`);

  await fsAppendFileAdapter({ filePath: outboxFilePath, contents: serialized });
};
