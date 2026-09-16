/**
 * PURPOSE: A rendered duration such as `'14m'`, `'2s ago'`, `'9h'` — the display string
 * `elapsedRenderTransformer` produces, never a millisecond count a caller must format itself. Reach
 * for this over `EpochMs` on any field `status` prints for a person or a session to read directly
 * (`uptime`, `lastBeat`), and keep `EpochMs` for a value that still gets arithmetic done to it.
 *
 * USAGE:
 * elapsedTextContract.parse('14m');
 * // Returns a branded ElapsedText
 */

import { z } from 'zod';

export const elapsedTextContract = z.string().min(1).brand<'ElapsedText'>();

export type ElapsedText = z.infer<typeof elapsedTextContract>;
