import { markdownSourceLineContract } from './markdown-source-line-contract';
import type { MarkdownSourceLine } from './markdown-source-line-contract';

export const MarkdownSourceLineStub = ({ value }: { value?: string } = {}): MarkdownSourceLine =>
  markdownSourceLineContract.parse(value ?? 'Gate 4 complete.');
