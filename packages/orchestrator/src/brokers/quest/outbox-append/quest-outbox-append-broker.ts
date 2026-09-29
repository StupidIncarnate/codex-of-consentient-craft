/**
 * PURPOSE: Appends a quest outbox line to the event-outbox.jsonl file in the dungeonmaster home directory
 *
 * USAGE:
 * await questOutboxAppendBroker({ questId: QuestIdStub() });
 * // Appends a JSON line with questId and timestamp to ~/.dungeonmaster/event-outbox.jsonl
 */

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { appendFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

import { questOutboxLineContract } from '../../../contracts/quest-outbox-line/quest-outbox-line-contract';

export const questOutboxAppendBroker = async ({ questId }: { questId: QuestId }): Promise<void> => {
  const { homePath } = dungeonmasterHomeFindBroker();

  const outboxFilePath = filePathContract.parse(
    join(homePath, locationsStatics.dungeonmasterHome.eventOutbox),
  );

  const outboxLine = questOutboxLineContract.parse({
    questId,
    timestamp: new Date().toISOString(),
  });

  await appendFile(outboxFilePath, `${JSON.stringify(outboxLine)}\n`);
};
