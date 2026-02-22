/**
 * PURPOSE: Formats the loop control section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatLoopControlSectionLayerBroker();
 * // Returns array of markdown lines for loop control rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatLoopControlSectionLayerBroker = (): MarkdownSectionLines => {
  const { loopControl } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Loop Control',
    '',
    `**${loopControl.rule}**`,
    '',
    `**Recursion:** ${loopControl.recursion}`,
    '',
    `**Regular loops:** ${loopControl.regularLoopsOk}`,
    '',
    '**Example (recursion):**',
    '```typescript',
    ...loopControl.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...loopControl.violations,
    '```',
    '',
  ]);
};
