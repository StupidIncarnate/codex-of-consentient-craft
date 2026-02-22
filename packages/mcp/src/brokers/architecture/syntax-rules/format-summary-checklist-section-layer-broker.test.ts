import { formatSummaryChecklistSectionLayerBroker } from './format-summary-checklist-section-layer-broker';
import { formatSummaryChecklistSectionLayerBrokerProxy } from './format-summary-checklist-section-layer-broker.proxy';
import { MarkdownSectionLinesStub } from '../../../contracts/markdown-section-lines/markdown-section-lines.stub';

describe('formatSummaryChecklistSectionLayerBroker', () => {
  it('VALID: {} => returns complete markdown section for summary checklist', () => {
    formatSummaryChecklistSectionLayerBrokerProxy();

    const result = formatSummaryChecklistSectionLayerBroker();

    const expected = MarkdownSectionLinesStub({
      value: [
        '## Summary Checklist',
        '',
        'Before committing any code, verify:',
        '',
        '- [ ] File uses kebab-case naming',
        '- [ ] Function uses export const with arrow syntax',
        '- [ ] File has PURPOSE/USAGE metadata comment at top',
        '- [ ] Function parameters use object destructuring',
        '- [ ] All imports are at the top of the file',
        '- [ ] Exported function has explicit return type using contracts',
        '- [ ] No any, @ts-ignore, or type suppressions',
        '- [ ] All string/number types are branded through Zod contracts',
        '- [ ] Error handling provides context',
        '- [ ] No console.log in production code',
        '- [ ] No while (true) loops (use recursion)',
        '- [ ] Efficient algorithms (Map/Set for lookups)',
        '- [ ] No dead code or commented-out code',
        '',
      ],
    });

    expect(result).toStrictEqual(expected);
  });
});
