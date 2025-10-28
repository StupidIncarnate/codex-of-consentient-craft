import { z } from 'zod';

export const discoverResultItemContract = z.object({
  name: z.string().brand<'FunctionName'>(),
  path: z.string().brand<'AbsoluteFilePath'>(),
  type: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
  usage: z.string().brand<'UsageExample'>().optional(),
  related: z.array(z.string().brand<'RelatedFile'>()).optional(),
});

export type DiscoverResultItem = z.infer<typeof discoverResultItemContract>;
