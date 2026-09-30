/**
 * PURPOSE: One object contract as the owner index sees it: the owner name derived from its const,
 * where it lives, the type inferred from it, its full schema text and every top-level key. Reach for
 * this over reading the contract file when a rule must ask who owns a key or whether a nested object
 * copies another contract's shape.
 *
 * USAGE:
 * ownerIndexOwnerContract.parse({ ownerName: 'Quest', contractName: 'questContract', filePath: '/repo/packages/a/src/contracts/quest/quest-contract.ts', packageName: '@repo/a', typeName: 'Quest', schemaText: 'z.object({ id: z.string() })', fields: [] });
 * // Returns: OwnerIndexOwner validated object
 */

import { z } from '#gateway/npm/zod';

import { ownerIndexFieldContract } from '../owner-index-field/owner-index-field-contract';

export const ownerIndexOwnerContract = z
  .object({
    ownerName: z.string().brand<'OwnerIndexOwnerOwnerName'>(),
    contractName: z.string().brand<'OwnerIndexOwnerContractName'>(),
    filePath: z
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
      .brand<'OwnerIndexOwnerFilePath'>(),
    packageName: z.string().min(1).brand<'OwnerIndexOwnerPackageName'>(),
    typeName: z.string().brand<'OwnerIndexOwnerTypeName'>().optional(),
    schemaText: z.string().brand<'OwnerIndexOwnerSchemaText'>(),
    fields: z.array(ownerIndexFieldContract),
  })
  .brand<'OwnerIndexOwner'>();

export type OwnerIndexOwner = z.infer<typeof ownerIndexOwnerContract>;
