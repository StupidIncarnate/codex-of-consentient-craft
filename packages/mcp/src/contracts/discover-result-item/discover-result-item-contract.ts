/**
 * PURPOSE: Contract for MCP discover result items with file metadata including function signature
 *
 * USAGE:
 * const item = discoverResultItemContract.parse({ name: 'userBroker', path: '/src/user-broker.ts', type: 'broker', signature: '() => User' });
 * // Returns validated DiscoverResultItem with signature string
 */

import { z } from '#gateway/npm/zod';
import { grepHitContract } from '../grep-hit/grep-hit-contract';

export const discoverResultItemContract = z
  .object({
    name: z.string().brand<'DiscoverResultItemName'>(),
    path: z.string().brand<'DiscoverResultItemPath'>(),
    type: z.string().brand<'DiscoverResultItemType'>(),
    purpose: z.string().brand<'DiscoverResultItemPurpose'>().optional(),
    usage: z.string().brand<'DiscoverResultItemUsage'>().optional(),
    signature: z.string().brand<'DiscoverResultItemSignature'>().optional(),
    relatedFiles: z.array(z.string().brand<'DiscoverResultItemRelatedFiles'>()),
    hits: z.array(grepHitContract).optional(),
  })
  .brand<'DiscoverResultItem'>();

export type DiscoverResultItem = z.infer<typeof discoverResultItemContract>;
