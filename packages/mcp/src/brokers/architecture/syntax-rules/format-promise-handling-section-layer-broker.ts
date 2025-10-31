/**
 * PURPOSE: Formats the promise handling section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatPromiseHandlingSectionLayerBroker();
 * // Returns array of markdown lines for promise handling rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatPromiseHandlingSectionLayerBroker = (): MarkdownSectionLines => {
  const { promiseHandling } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Promise Handling',
    '',
    `**${promiseHandling.rule}**`,
    '',
    `- ${promiseHandling.handleErrorsAppropriately}`,
    `- ${promiseHandling.parallelOperations}`,
    `- ${promiseHandling.sequentialOperations}`,
    '',
    '**Examples:**',
    '```typescript',
    ...promiseHandling.examples.flatMap((example) => [example, '']),
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...promiseHandling.violations,
    '```',
    '',
  ]);
};
