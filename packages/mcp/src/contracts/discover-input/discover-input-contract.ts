import { z } from 'zod';

export const discoverInputContract = z.object({
  type: z.enum(['standards', 'files']),
  // For type: "standards"
  section: z.string().brand<'StandardsSection'>().optional(),
  // For type: "files"
  path: z.string().brand<'FilePath'>().optional(),
  fileType: z.string().brand<'FileType'>().optional(),
  search: z.string().brand<'SearchQuery'>().optional(),
  name: z.string().brand<'FileName'>().optional(),
});

export type DiscoverInput = z.infer<typeof discoverInputContract>;
