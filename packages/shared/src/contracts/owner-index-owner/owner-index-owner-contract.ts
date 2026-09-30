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

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { identifierContract } from '../identifier/identifier-contract';
import { ownerIndexFieldContract } from '../owner-index-field/owner-index-field-contract';
import { packageNameContract } from '../package-name/package-name-contract';

export const ownerIndexOwnerContract = z.object({
  ownerName: identifierContract,
  contractName: identifierContract,
  filePath: absoluteFilePathContract,
  packageName: packageNameContract,
  typeName: identifierContract.optional(),
  schemaText: z.string().brand<'OwnerIndexOwnerSchemaText'>(),
  fields: z.array(ownerIndexFieldContract),
});

export type OwnerIndexOwner = z.infer<typeof ownerIndexOwnerContract>;
