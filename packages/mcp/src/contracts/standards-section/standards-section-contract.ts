import { z } from 'zod';

export const standardsSectionContract = z.object({
  section: z.string().brand<'SectionPath'>(),
  content: z.string().brand<'MarkdownContent'>(),
  path: z.string().brand<'FilePath'>(),
});

export type StandardsSection = z.infer<typeof standardsSectionContract>;
