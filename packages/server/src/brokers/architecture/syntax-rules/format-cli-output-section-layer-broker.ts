/**
 * PURPOSE: Formats the CLI output section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatCliOutputSectionLayerBroker();
 * // Returns array of markdown lines for CLI output rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatCliOutputSectionLayerBroker = (): MarkdownSectionLines => {
  const { cliOutput } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## CLI Output',
    '',
    `**${cliOutput.rule}**`,
    '',
    `- **${cliOutput.standardOutput}**`,
    `- **${cliOutput.errorOutput}**`,
    `- **${cliOutput.includeNewlines}**`,
    '',
    '**Examples:**',
    '```typescript',
    ...cliOutput.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...cliOutput.violations,
    '```',
    '',
  ]);
};
