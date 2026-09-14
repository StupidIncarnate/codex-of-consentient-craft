/**
 * PURPOSE: One local image path found in a chat message, paired with the ordinal it earned in the
 * scan's text order. Reach for this over passing a path and a number separately — the pairing is
 * what lets the copy and token-rewrite steps downstream key a file back to the exact text run it
 * replaces.
 *
 * USAGE:
 * localImagePathMatchContract.parse({ path: '/home/user/pasted.png', ordinal: 1 });
 * // Returns branded LocalImagePathMatch
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { pastedImageOrdinalContract } from '../pasted-image-ordinal/pasted-image-ordinal-contract';

export const localImagePathMatchContract = z.object({
  path: absoluteFilePathContract,
  ordinal: pastedImageOrdinalContract,
});

export type LocalImagePathMatch = z.infer<typeof localImagePathMatchContract>;
