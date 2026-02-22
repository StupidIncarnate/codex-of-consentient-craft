/**
 * PURPOSE: Formats the import rules section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatImportRulesSectionLayerBroker();
 * // Returns array of markdown lines for import rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatImportRulesSectionLayerBroker = (): MarkdownSectionLines => {
  const { importRules } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Import Rules',
    '',
    `**${importRules.rule}**`,
    '',
    `- ${importRules.preferEs6}`,
    `- ${importRules.grouping}`,
    '',
    '**Example:**',
    '```typescript',
    ...importRules.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...importRules.violations,
    '```',
    '',
  ]);
};
