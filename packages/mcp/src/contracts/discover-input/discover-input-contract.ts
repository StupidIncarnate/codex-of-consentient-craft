/**
 * PURPOSE: Defines the input schema for the MCP discover tool that searches files in the codebase
 *
 * USAGE:
 * const input: DiscoverInput = discoverInputContract.parse({ type: 'files', fileType: 'broker' });
 * // Returns validated DiscoverInput with optional filters (path, fileType, search, name)
 */
import { z } from 'zod';

export const discoverInputContract = z.object({
  type: z.literal('files'),
  path: z.string().brand<'FilePath'>().optional(),
  fileType: z.string().brand<'FileType'>().optional(),
  search: z.string().brand<'SearchQuery'>().optional(),
  name: z.string().brand<'FileName'>().optional(),
});

export type DiscoverInput = z.infer<typeof discoverInputContract>;
