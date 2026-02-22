/**
 * PURPOSE: Formats the function exports section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatFunctionExportsSectionLayerBroker();
 * // Returns array of markdown lines for function export rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatFunctionExportsSectionLayerBroker = (): MarkdownSectionLines => {
  const { functionExports } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Function Exports',
    '',
    `**${functionExports.rule}**`,
    '',
    '**Exceptions:**',
    ...functionExports.exceptions.map((exception) => `- ${exception}`),
    '',
    '**Examples:**',
    '```typescript',
    ...functionExports.examples.flatMap((example) => [example, '']),
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...functionExports.violations.flatMap((violation) => [violation, '']),
    '```',
    '',
  ]);
};
