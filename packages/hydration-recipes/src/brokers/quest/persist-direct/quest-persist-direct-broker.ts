/**
 * PURPOSE: Writes a quest file atomically (temp-then-rename), then appends an outbox line — the
 * same two effects `questPersistBroker` produces in production. Reach for this from the quest
 * `write` route and from every operation route: `questPersistBroker` and
 * `questOperationsUpdateBroker` are both internal to `@dungeonmaster/orchestrator` (absent from
 * `src/index.ts` and from its package.json `exports` map, which lists only `.` and `./testing`),
 * so no package outside orchestrator — this one included, and `packages/web`'s own
 * `quest.harness.ts` before it, which carries the identical comment for the identical reason —
 * can call the real broker directly. `copies:` on the ingredients that reach this still names the
 * broker being imitated; this is the imitation, not a call-through, and that gap is a chunk-level
 * finding, not a workaround invented here.
 *
 * What this does NOT reproduce: `questWithModifyLockBroker`'s per-questId mutex. Two ROWS in one
 * plan never share a questId (the runner mints one per row), and the runner walks depth-first and
 * serially, so no two writes to the SAME quest file are ever in flight at once from this package.
 *
 * USAGE:
 * await questPersistDirectBroker({ target, questFilePath, contents, questId });
 * // Writes questFilePath atomically, then appends one line to <target.home>/event-outbox.jsonl
 */
import { appendFile, rename, writeFile } from '#gateway/node/fs__promises';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, FilePath, Quest } from '@dungeonmaster/shared/contracts';

import { dmQuestOutboxLineContract } from '../../../contracts/dm-quest-outbox-line/dm-quest-outbox-line-contract';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

const TMP_SUFFIX = '.tmp';

export const questPersistDirectBroker = async ({
  target,
  questFilePath,
  contents,
  questId,
}: {
  target: DmTarget;
  questFilePath: FilePath;
  contents: FileContents;
  questId: Quest['id'];
}): Promise<void> => {
  const tmpPath = filePathContract.parse(`${questFilePath}${TMP_SUFFIX}`);

  await writeFile(tmpPath, contents);
  await rename(tmpPath, questFilePath);

  const outboxPath = filePathContract.parse(
    `${target.home}/${locationsStatics.dungeonmasterHome.eventOutbox}`,
  );
  const outboxLine = dmQuestOutboxLineContract.parse({
    questId,
    timestamp: new Date().toISOString(),
  });

  await appendFile(outboxPath, fileContentsContract.parse(`${JSON.stringify(outboxLine)}\n`));
};
