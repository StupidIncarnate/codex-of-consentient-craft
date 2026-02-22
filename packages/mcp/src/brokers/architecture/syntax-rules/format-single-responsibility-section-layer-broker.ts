/**
 * PURPOSE: Formats the single responsibility section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatSingleResponsibilitySectionLayerBroker();
 * // Returns array of markdown lines for single responsibility rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatSingleResponsibilitySectionLayerBroker = (): MarkdownSectionLines => {
  const { singleResponsibility } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Single Responsibility Per File',
    '',
    `**${singleResponsibility.rule}**`,
    '',
    '**Allowed co-exports:**',
    ...singleResponsibility.allowedCoExports.map((allowed) => `- ${allowed}`),
    '',
    '**Examples:**',
    '```typescript',
    ...singleResponsibility.examples.flatMap((example) => [example, '']),
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...singleResponsibility.violations.flatMap((violation) => [violation, '']),
    '```',
    '',
  ]);
};
