/**
 * PURPOSE: Formats the function parameters section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatFunctionParametersSectionLayerBroker();
 * // Returns array of markdown lines for function parameter rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatFunctionParametersSectionLayerBroker = (): MarkdownSectionLines => {
  const { functionParameters } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Function Parameters',
    '',
    `**${functionParameters.rule}**`,
    '',
    '**Exceptions:**',
    ...functionParameters.exceptions.map((exception) => `- ${exception}`),
    '',
    '**Examples:**',
    '```typescript',
    ...functionParameters.examples.flatMap((example) => [example, '']),
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...functionParameters.violations.flatMap((violation) => [violation, '']),
    '```',
    '',
    `**Note:** ${functionParameters.passCompleteObjects}`,
    '',
    `**ID Extraction:** ${functionParameters.extractIdPattern}`,
    '',
  ]);
};
