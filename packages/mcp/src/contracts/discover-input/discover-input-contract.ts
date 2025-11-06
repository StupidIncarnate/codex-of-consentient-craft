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

export const discoverInputContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('files'),
    path: z.string().brand<'FilePath'>().optional(),
    fileType: z.string().brand<'FileType'>().optional(),
    search: z.string().brand<'SearchQuery'>().optional(),
    name: z.string().brand<'FileName'>().optional(),
  }),
  z.object({
    type: z.literal('standards'),
    section: z.string().brand<'SectionPath'>().optional(),
  }),
]);

export type DiscoverInput = z.infer<typeof discoverInputContract>;
