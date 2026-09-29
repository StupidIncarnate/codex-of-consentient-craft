/**
 * PURPOSE: The page-side answer to "does ref N still reach an element", before it is turned into a
 * RefResolution. `out-of-range` means the page's registry array does not reach that index at all,
 * which only the Node-side mint counter can then split into a navigation and a ref never minted
 * here. Reach for RefResolution for anything a step reports; this is only what the page said.
 *
 * USAGE:
 * rawRefStateContract.parse('detached');
 * // Returns 'detached'
 */

import { z } from 'zod';

export const rawRefStateContract = z.enum(['live', 'detached', 'out-of-range']);

export type RawRefState = z.infer<typeof rawRefStateContract>;
