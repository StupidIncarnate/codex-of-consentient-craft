/**
 * PURPOSE: One imported name in a production file that lands on a contract file: the name the file
 * uses locally, the contract file it resolves to, and whether the import is type-only. Reach for
 * this to hand the uses scan exactly the names worth watching for a parse call.
 *
 * USAGE:
 * contractUsesBindingContract.parse({ localName: 'thingContract', targetFile: '/repo/a-contract.ts', isTypeOnly: false });
 * // Returns: ContractUsesBinding validated object
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { identifierContract } from '../identifier/identifier-contract';

export const contractUsesBindingContract = z.object({
  localName: identifierContract,
  targetFile: absoluteFilePathContract,
  isTypeOnly: z.boolean(),
});

export type ContractUsesBinding = z.infer<typeof contractUsesBindingContract>;
