/**
 * PURPOSE: Formats the error handling section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatErrorHandlingSectionLayerBroker();
 * // Returns array of markdown lines for error handling rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatErrorHandlingSectionLayerBroker = (): MarkdownSectionLines => {
  const { errorHandling } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Error Handling',
    '',
    `**${errorHandling.rule}**`,
    '',
    `- ${errorHandling.neverSilentlySwallow}`,
    `- ${errorHandling.provideContext}`,
    '',
    '**Examples:**',
    '```typescript',
    ...errorHandling.examples.flatMap((example) => [example, '']),
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...errorHandling.violations.flatMap((violation) => [violation, '']),
    '```',
    '',
  ]);
};
