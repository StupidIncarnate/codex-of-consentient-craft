/**
 * PURPOSE: Contract for MCP discover result items with file metadata including function signature
 *
 * USAGE:
 * const item = discoverResultItemContract.parse({ name: 'userBroker', path: '/src/user-broker.ts', type: 'broker', signature: '() => User' });
 * // Returns validated DiscoverResultItem with signature string
 */

import { z } from 'zod';

export const discoverResultItemContract = z.object({
  name: z.string().brand<'FunctionName'>(),
  path: z.string().brand<'AbsoluteFilePath'>(),
  type: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
  usage: z.string().brand<'UsageExample'>().optional(),
  signature: z.string().brand<'FunctionSignature'>().optional(),
});

export type DiscoverResultItem = z.infer<typeof discoverResultItemContract>;
