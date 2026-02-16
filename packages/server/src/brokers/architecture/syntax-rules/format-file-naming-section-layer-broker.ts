/**
 * PURPOSE: Formats the file naming section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatFileNamingSectionLayerBroker();
 * // Returns array of markdown lines for file naming rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatFileNamingSectionLayerBroker = (): MarkdownSectionLines => {
  const { fileNaming } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## File Naming',
    '',
    `**${fileNaming.rule}**`,
    '',
    `Pattern: ${fileNaming.patternDescription}`,
    '',
    '**Examples:**',
    ...fileNaming.examples.map((example) => `- ✅ \`${example}\``),
    '',
    '**Violations:**',
    ...fileNaming.violations.map((violation) => `- ❌ \`${violation}\``),
    '',
  ]);
};
