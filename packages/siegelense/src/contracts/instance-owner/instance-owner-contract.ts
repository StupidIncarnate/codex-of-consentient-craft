/**
 * PURPOSE: Identifies the session that started an instance, carried so the "no session may kill a
 * live instance it does not own" rule is something a caller can CHECK rather than something it
 * merely promises to respect. Reaping an instance is decided by staleness, never by ownership — any
 * session may reap one whose heartbeat has gone cold, because a cold heartbeat is a fact anyone can
 * check — but a KILL of a live instance is gated on this value matching. Reach for this over
 * instanceIdContract when the question is "who may act on this instance", not "which instance is
 * this".
 *
 * USAGE:
 * instanceOwnerContract.parse('42781');
 * // Returns: '42781' as InstanceOwner
 */

import { z } from 'zod';

export const instanceOwnerContract = z.string().min(1).brand<'InstanceOwner'>();

export type InstanceOwner = z.infer<typeof instanceOwnerContract>;
