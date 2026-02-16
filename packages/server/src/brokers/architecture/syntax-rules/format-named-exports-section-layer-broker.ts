/**
 * PURPOSE: Formats the named exports section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatNamedExportsSectionLayerBroker();
 * // Returns array of markdown lines for named export rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatNamedExportsSectionLayerBroker = (): MarkdownSectionLines => {
  const { namedExports } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Named Exports',
    '',
    `**${namedExports.rule}**`,
    '',
    '**Exceptions:**',
    ...namedExports.exceptions.map((exception) => `- ${exception}`),
    '',
    '**Examples:**',
    ...namedExports.examples.map((example) => `- ✅ \`${example}\``),
    '',
    '**Violations:**',
    ...namedExports.violations.map((violation) => `- ❌ \`${violation}\``),
    '',
  ]);
};
