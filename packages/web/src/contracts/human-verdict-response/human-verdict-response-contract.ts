/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/human-verdict in one permissive
 * object, so the broker can safeParse the body once and branch on HTTP status rather than on the
 * body's shape — the same reason `commentBatchResponseContract` is shaped this way.
 *
 * USAGE:
 * humanVerdictResponseContract.safeParse({ ok: true });
 * // Returns success with the 200 success shape
 * humanVerdictResponseContract.safeParse({ error: 'Observable "x" is not flagged verifyByHuman' });
 * // Returns success with the 400 refusal shape
 */

import { z } from 'zod';

export const humanVerdictResponseContract = z.object({
  ok: z.literal(true).optional(),
  error: z.string().min(1).brand<'HumanVerdictErrorMessage'>().optional(),
});

export type HumanVerdictResponse = z.infer<typeof humanVerdictResponseContract>;
