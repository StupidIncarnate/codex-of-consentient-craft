import { MarkdownSectionLinesStub } from './markdown-section-lines.stub';

describe('markdownSectionLinesContract', () => {
  it('VALID: {value: ["# Title", "", "Content"]} => parses successfully', () => {
    const result = MarkdownSectionLinesStub({
      value: ['# Title', '', 'Content'],
    });

    expect(result).toStrictEqual(['# Title', '', 'Content']);
  });

  it('VALID: {value: []} => parses successfully', () => {
    const result = MarkdownSectionLinesStub({ value: [] });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {value: ["single line"]} => parses successfully', () => {
    const result = MarkdownSectionLinesStub({ value: ['single line'] });

    expect(result).toStrictEqual(['single line']);
  });
});
