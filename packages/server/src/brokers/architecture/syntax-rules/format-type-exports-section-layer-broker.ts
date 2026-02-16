/**
 * PURPOSE: Formats the type exports section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatTypeExportsSectionLayerBroker();
 * // Returns array of markdown lines for type export rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatTypeExportsSectionLayerBroker = (): MarkdownSectionLines => {
  const { typeExports } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Type Export Rules',
    '',
    `**${typeExports.rule}**`,
    '',
    `- **Regular files:** ${typeExports.regularFiles}`,
    `- **Index files:** ${typeExports.indexFiles}`,
    `- **Forbidden:** ${typeExports.forbidden}`,
    '',
    '**Examples:**',
    '```typescript',
    ...typeExports.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...typeExports.violations,
    '```',
    '',
  ]);
};
