import type { MarkdownSectionLines } from './markdown-section-lines-contract';
import { markdownSectionLinesContract } from './markdown-section-lines-contract';

export const MarkdownSectionLinesStub = (
  {
    value,
  }: {
    value: readonly string[];
  } = {
    value: ['# Example', '', 'Content'],
  },
): MarkdownSectionLines => markdownSectionLinesContract.parse(value);
