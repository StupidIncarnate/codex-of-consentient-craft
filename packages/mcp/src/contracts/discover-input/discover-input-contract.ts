/**
 * PURPOSE: Defines the input schema for the MCP discover tool that searches files or standards in the codebase
 *
 * USAGE:
 * const input: DiscoverInput = discoverInputContract.parse({ type: 'files', fileType: 'broker' });
 * // Returns validated DiscoverInput with optional filters (path, fileType, search, name)
 * const standardsInput: DiscoverInput = discoverInputContract.parse({ type: 'standards', section: 'testing/proxy-architecture' });
 * // Returns validated DiscoverInput for standards with optional section filter
 */
import { z } from 'zod';

// NOTE: MCP requires inputSchema to have type: "object" at root level.
// z.discriminatedUnion produces "anyOf" which breaks MCP tool loading.
// Using single object with optional fields for MCP compatibility.
export const discoverInputContract = z.object({
  type: z
    .enum(['files', 'standards'])
    .describe('Type of discovery - "files" to search code, "standards" to search documentation'),
  // Fields for 'files' type
  path: z.string().brand<'FilePath'>().describe('Path to search (for files type)').optional(),
  fileType: z
    .string()
    .brand<'FileType'>()
    .describe('File type to filter: broker, widget, guard, transformer, adapter, contract, etc.')
    .optional(),
  search: z.string().brand<'SearchQuery'>().describe('Search query to filter results').optional(),
  name: z.string().brand<'FileName'>().describe('Specific file name to find').optional(),
  // Fields for 'standards' type
  section: z
    .string()
    .brand<'SectionPath'>()
    .describe('Section path to filter (for standards type)')
    .optional(),
});

export type DiscoverInput = z.infer<typeof discoverInputContract>;
