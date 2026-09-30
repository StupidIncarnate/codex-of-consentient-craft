/**
 * PURPOSE: A non-object contract that is one branded value, such as `questIdContract`, with the
 * brand text it carries. Reach for this over the owner list when a rule must resolve a field that
 * points at a standalone brand back to the text it stands for.
 *
 * USAGE:
 * ownerIndexStandaloneBrandContract.parse({ contractName: 'questIdContract', brandText: 'QuestId', filePath: '/repo/packages/a/src/contracts/quest-id/quest-id-contract.ts', packageName: '@repo/a' });
 * // Returns: OwnerIndexStandaloneBrand validated object
 */

import { z } from '#gateway/npm/zod';

export const ownerIndexStandaloneBrandContract = z
  .object({
    contractName: z.string().brand<'OwnerIndexStandaloneBrandContractName'>(),
    brandText: z.string().brand<'OwnerIndexStandaloneBrandBrandText'>(),
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
      .brand<'OwnerIndexStandaloneBrandFilePath'>(),
    packageName: z.string().min(1).brand<'OwnerIndexStandaloneBrandPackageName'>(),
  })
  .brand<'OwnerIndexStandaloneBrand'>();

export type OwnerIndexStandaloneBrand = z.infer<typeof ownerIndexStandaloneBrandContract>;
