/**
 * PURPOSE: Formats the summary checklist section of the universal syntax rules markdown
 *
 * USAGE:
 * const lines = formatSummaryChecklistSectionLayerBroker();
 * // Returns array of markdown lines for summary checklist
 */
import type { MarkdownSectionLines } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { markdownSectionLinesContract } from '../../../contracts/markdown-section-lines/markdown-section-lines-contract';
import { universalSyntaxRulesStatics } from '../../../statics/universal-syntax-rules/universal-syntax-rules-statics';

export const formatSummaryChecklistSectionLayerBroker = (): MarkdownSectionLines => {
  const { summaryChecklist } = universalSyntaxRulesStatics;
  return markdownSectionLinesContract.parse([
    '## Summary Checklist',
    '',
    'Before committing any code, verify:',
    '',
    ...summaryChecklist.items.map((item) => `- [ ] ${item}`),
    '',
  ]);
};
