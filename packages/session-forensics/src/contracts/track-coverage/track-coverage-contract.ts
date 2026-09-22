/**
 * PURPOSE: One sign-off track's coverage of one flow. A sign-off track is one reviewing role —
 * codeweaver, flowrider or siegemaster — and a flow is one graph of work inside a quest. Reach for
 * this over reading the raw counts off a report. A coverage row whose counts do not balance is a
 * measurement bug, and this contract refuses to parse it. The bug therefore surfaces here, not
 * three commands downstream in a summary nobody double-checks.
 *
 * `unmet` is its own count, never folded into `unsigned`. A unit this track marked `unmet` HAS been
 * signed — a session looked and left work open — where `unsigned` means nobody of this track has
 * marked it at all. Collapsing the two makes a failed attempt read identically to one nobody
 * started. `met + cantMeet + unmet === signed` is what the second refine below enforces.
 *
 * USAGE:
 * trackCoverageContract.parse({
 *   flowId: 'paste-image-into-composer', track: 'codeweaver',
 *   owed: 58, signed: 58, met: 54, cantMeet: 3, unmet: 1, unsigned: 0,
 * });
 */
import { z } from 'zod';

export const trackCoverageContract = z
  .object({
    flowId: z.string(),
    track: z.enum(['codeweaver', 'flowrider', 'siegemaster']),
    owed: z.number().int().nonnegative(),
    signed: z.number().int().nonnegative(),
    met: z.number().int().nonnegative(),
    cantMeet: z.number().int().nonnegative(),
    unmet: z.number().int().nonnegative(),
    unsigned: z.number().int().nonnegative(),
  })
  .refine((coverage) => coverage.signed + coverage.unsigned === coverage.owed, {
    message: 'signed + unsigned must equal owed',
  })
  .refine((coverage) => coverage.met + coverage.cantMeet + coverage.unmet === coverage.signed, {
    message: 'met + cantMeet + unmet must equal signed',
  })
  .brand<'TrackCoverage'>();

export type TrackCoverage = z.infer<typeof trackCoverageContract>;
