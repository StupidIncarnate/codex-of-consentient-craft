/**
 * PURPOSE: One exported `z.enum([...])` contract as the owner index sees it: the name its const
 * gives it, where it lives, and its values in sorted order. Reach for this over the owner list when
 * a rule must ask whether an inline enum repeats the values of an enum contract that already exists;
 * an enum has no keys, so it is never an owner. `key` is set only when the enum is an inline one found
 * under that key of an object contract, and then `contractName` and `ownerName` name that object.
 *
 * USAGE:
 * ownerIndexEnumContract.parse({ ownerName: 'QuestStatus', contractName: 'questStatusContract', filePath: '/repo/packages/a/src/contracts/quest-status/quest-status-contract.ts', packageName: '@repo/a', values: ['done', 'open'] });
 * // Returns: OwnerIndexEnum validated object
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { contentTextContract } from '../content-text/content-text-contract';
import { identifierContract } from '../identifier/identifier-contract';
import { packageNameContract } from '../package-name/package-name-contract';

export const ownerIndexEnumContract = z.object({
  ownerName: identifierContract,
  contractName: identifierContract,
  filePath: absoluteFilePathContract,
  packageName: packageNameContract,
  key: identifierContract.optional(),
  values: z.array(contentTextContract),
});

export type OwnerIndexEnum = z.infer<typeof ownerIndexEnumContract>;
