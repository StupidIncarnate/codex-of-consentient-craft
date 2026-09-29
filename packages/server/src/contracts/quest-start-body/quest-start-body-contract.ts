/**
 * PURPOSE: Defines the optional JSON body of POST /api/quests/:questId/start. `play: false` asks the
 * start route to seed and enqueue the quest WITHOUT pressing play on the Node dispatcher — the
 * shape a hydration recipe sends when it walks a quest through `in_progress` only to set up state,
 * so the lane's server never runs a real riftcarver against a seeded quest. An absent body, or an
 * absent `play`, keeps the Begin Quest behaviour: start plays the dispatcher.
 *
 * USAGE:
 * const { play } = questStartBodyContract.parse(body);
 * // Returns: QuestStartBody — `play` is undefined unless the caller sent it
 */

import { z } from 'zod';

export const questStartBodyContract = z.object({
  play: z.boolean().optional(),
});

export type QuestStartBody = z.infer<typeof questStartBodyContract>;
