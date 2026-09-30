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

export const contractUsesBindingContract = z
  .object({
    localName: z.string().brand<'ContractUsesBindingLocalName'>(),
    targetFile: z
      .string()
      .min(1)
      .refine(
        (path) => {
          if (path.startsWith('/')) {
            return true;
          }
          if (/^[A-Za-z]:\\/u.test(path)) {
            return true;
          }
          return false;
        },
        { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
      )
      .brand<'ContractUsesBindingTargetFile'>(),
    isTypeOnly: z.boolean(),
  })
  .brand<'ContractUsesBinding'>();

export type ContractUsesBinding = z.infer<typeof contractUsesBindingContract>;
