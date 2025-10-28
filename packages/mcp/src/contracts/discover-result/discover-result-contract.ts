import { z } from 'zod';

const discoverResultItemContract = z.object({
  name: z.string().brand<'FunctionName'>(),
  path: z.string().brand<'AbsoluteFilePath'>(),
  type: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
  usage: z.string().brand<'UsageExample'>().optional(),
  related: z.array(z.string().brand<'RelatedFile'>()).optional(),
});

export const discoverResultContract = z.object({
  results: z.array(discoverResultItemContract),
  count: z.number().int().brand<'ResultCount'>(),
});

export type DiscoverResult = z.infer<typeof discoverResultContract>;
