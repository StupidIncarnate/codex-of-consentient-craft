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

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const ownerIndexUsageContract = z.object({
  filePath: absoluteFilePathContract,
  contractName: z.string().brand<'OwnerIndexUsageContractName'>(),
  key: z.string().brand<'OwnerIndexUsageKey'>(),
  kind: z.enum(['owner-reuse', 'brand-ref', 'inline-copy']),
});

export type OwnerIndexUsage = z.infer<typeof ownerIndexUsageContract>;
