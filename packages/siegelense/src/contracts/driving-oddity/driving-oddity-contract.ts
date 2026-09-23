/**
 * PURPOSE: One durable fact a walk found about the real app — a testId or route whose behaviour is
 * worth knowing before the NEXT walk drives it, so it reads this once instead of rediscovering the
 * quirk at the cost of a whole round (`.quest-plans/`'s own `TRAPS` heading is wiped when the quest
 * ends; this file is committed and outlives it). `kind` splits the entry into the two things "click
 * the wrapper, not the label" can mean: a genuine platform quirk to work around, or a defect a real
 * user with a real mouse would also hit. Reach for this over `CitationReference`: a citation records
 * who still needs an INSTANCE's evidence, while this records a fact about the APP that outlives any
 * one instance or run.
 *
 * USAGE:
 * drivingOddityContract.parse({
 *   key: 'GUILD_ADD_MODAL',
 *   line: 'Clicking the label does nothing on this button — click the wrapper instead.',
 *   kind: 'quirk',
 * });
 * // Returns a validated DrivingOddity
 */

import { z } from 'zod';

export const drivingOddityContract = z
  .object({
    key: z.string().min(1).brand<'DrivingOddityKey'>(),
    line: z.string().min(1).brand<'DrivingOddityLine'>(),
    kind: z.enum(['quirk', 'defect']).brand<'DrivingOddityKind'>(),
  })
  .strict();

export type DrivingOddity = z.infer<typeof drivingOddityContract>;
