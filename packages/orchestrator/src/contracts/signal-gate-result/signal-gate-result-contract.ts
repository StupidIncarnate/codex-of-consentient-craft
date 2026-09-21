/**
 * PURPOSE: What the signal gate decided about one step, and — when it refused — the two payloads a
 * caller cannot rebuild for itself: the ids, which route the fix, and the prose, which is what the
 * tool boundary throws back at the session. Reach for this over `stepOutcomeContract` when the
 * question is whether a signal is ALLOWED at all; that one names which word the record derives to
 * once it is.
 *
 * USAGE:
 * signalGateResultContract.parse({ ok: true });
 * // Returns: SignalGateResult — the passing variant, which carries nothing else
 *
 * A DISCRIMINATED UNION rather than a boolean plus two optionals. The passing variant has NO
 * `message` key at all, so a caller that reads `result.message` without narrowing does not compile —
 * where an always-present `message: ''` would let exactly that read through and ship an empty
 * refusal.
 */

import { unitIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const signalGateResultContract = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
  }),
  z.object({
    ok: z.literal(false),
    unmarked: z.array(unitIdContract),
    message: z.string().min(1).brand<'SignalGateRefusalMessage'>(),
  }),
]);

export type SignalGateResult = z.infer<typeof signalGateResultContract>;
