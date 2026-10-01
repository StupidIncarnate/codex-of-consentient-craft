/**
 * PURPOSE: The final text on a Claude CLI `result` stream line — the session's last message, which
 * the CLI repeats once the turn ends. Reach for this over shared's `resultStreamLineContract`, which
 * reads cost and duration and drops the text: this one is where a session's closing wall marker is.
 *
 * USAGE:
 * sessionResultTextLineContract.safeParse(JSON.parse(rawLine));
 * // Succeeds on a result line: { type: 'result', result: 'DUNGEONMASTER-WALL: …' }
 */

import { z } from '#gateway/npm/zod';

export const sessionResultTextLineContract = z
  .object({
    type: z.literal('result'),
    result: z.string().brand<'SessionResultTextLineResult'>(),
  })
  .brand<'SessionResultTextLine'>();

export type SessionResultTextLine = z.infer<typeof sessionResultTextLineContract>;
