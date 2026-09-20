/**
 * PURPOSE: Mirrors `@dungeonmaster/orchestrator`'s internal `questOutboxLineContract` — a quest
 * id and a timestamp, one JSON line per quest mutation. Reach for this over importing the real
 * one: it lives at `packages/orchestrator/src/contracts/quest-outbox-line/`, absent from both
 * `src/index.ts` and the package's `exports` map, so no package outside orchestrator can reach
 * it. This shape is not volatile and not a gap — the outbox is a side channel the watcher tails,
 * no record carries it, and no comparison in this package reads it back.
 *
 * USAGE:
 * dmQuestOutboxLineContract.parse({ questId: 'add-auth', timestamp: '2024-01-15T10:00:00.000Z' });
 * // Returns { questId: QuestId; timestamp: DmQuestOutboxTimestamp }
 */
import { z } from 'zod';

import { questIdContract } from '@dungeonmaster/shared/contracts';

export const dmQuestOutboxLineContract = z.object({
  questId: questIdContract,
  timestamp: z.string().datetime().brand<'DmQuestOutboxTimestamp'>(),
});

export type DmQuestOutboxLine = z.infer<typeof dmQuestOutboxLineContract>;
