/**
 * PURPOSE: Formats the performance section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatPerformanceSectionLayerBroker();
 * // Returns array of markdown lines for performance rules
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatPerformanceSectionLayerBroker = (): MarkdownSectionLines => {
  const { performance } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Performance',
    '',
    '### Default to Efficient Algorithms',
    '',
    `**${performance.efficientAlgorithms.rule}**`,
    '',
    '**Example:**',
    '```typescript',
    ...performance.efficientAlgorithms.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...performance.efficientAlgorithms.violations,
    '```',
    '',
    '### Remove Dead Code',
    '',
    `**${performance.removeDeadCode.rule}**`,
    '',
    '### Use Reflect Methods',
    '',
    '**Reflect.deleteProperty():**',
    '',
    performance.useReflectMethods.deleteProperty.rule,
    '',
    '```typescript',
    ...performance.useReflectMethods.deleteProperty.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...performance.useReflectMethods.deleteProperty.violations,
    '```',
    '',
    '**Reflect.get():**',
    '',
    performance.useReflectMethods.get.rule,
    '',
    `*Rationale:* ${performance.useReflectMethods.get.rationale}`,
    '',
    '**Example:**',
    '```typescript',
    ...performance.useReflectMethods.get.examples,
    '```',
    '',
    '**Violations:**',
    '```typescript',
    ...performance.useReflectMethods.get.violations,
    '```',
    '',
  ]);
};
