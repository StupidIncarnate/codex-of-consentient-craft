/**
 * PURPOSE: Defines the schema for a standards document section with path and markdown content
 *
 * USAGE:
 * const section: StandardsSection = standardsSectionContract.parse({ section: 'Testing', content: '## Testing...', path: '/path/to/standards.md' });
 * // Returns validated standards section with section path, markdown content, and file path
 */
import { z } from 'zod';

export const standardsSectionContract = z.object({
  section: z.string().brand<'SectionPath'>(),
  content: z.string().brand<'MarkdownContent'>(),
  path: z.string().brand<'FilePath'>(),
});

export type StandardsSection = z.infer<typeof standardsSectionContract>;
