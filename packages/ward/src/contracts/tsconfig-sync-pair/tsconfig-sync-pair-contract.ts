/**
 * PURPOSE: Defines the pairing of a tsconfig path with its current on-disk data and expected references
 *
 * USAGE:
 * tsconfigSyncPairContract.parse({ tsconfigPath: '/repo/packages/shared/tsconfig.json', currentData: {}, expectedRefs: [], ensureComposite: true });
 * // Returns: TsconfigSyncPair validated object
 */

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { tsconfigJsonWritableContract } from '../tsconfig-json-writable/tsconfig-json-writable-contract';
import { tsconfigReferenceContract } from '../tsconfig-reference/tsconfig-reference-contract';

export const tsconfigSyncPairContract = z.object({
  tsconfigPath: absoluteFilePathContract,
  currentData: tsconfigJsonWritableContract,
  expectedRefs: z.array(tsconfigReferenceContract),
  ensureComposite: z.boolean(),
});

export type TsconfigSyncPair = z.infer<typeof tsconfigSyncPairContract>;
