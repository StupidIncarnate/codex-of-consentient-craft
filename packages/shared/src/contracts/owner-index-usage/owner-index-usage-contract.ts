/**
 * PURPOSE: One field elsewhere that relates to an owner's field: it reuses the owner's field through
 * `.shape.key`, points at a standalone brand with the same text, or declares an inline copy of that
 * text. Reach for this over a text search when a codemod must retype each of those sites.
 *
 * USAGE:
 * ownerIndexUsageContract.parse({ filePath: '/repo/a-contract.ts', contractName: 'otherContract', key: 'questId', kind: 'inline-copy' });
 * // Returns: OwnerIndexUsage validated object
 */

import { z } from '#gateway/npm/zod';


export const ownerIndexUsageContract = z.object({
  filePath: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'OwnerIndexUsageFilePath'>(),
  contractName: z.string().brand<'OwnerIndexUsageContractName'>(),
  key: z.string().brand<'OwnerIndexUsageKey'>(),
  kind: z.enum(['owner-reuse', 'brand-ref', 'inline-copy']),
}).brand<'OwnerIndexUsage'>();

export type OwnerIndexUsage = z.infer<typeof ownerIndexUsageContract>;
