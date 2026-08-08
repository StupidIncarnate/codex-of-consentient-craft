import { markdownSourceContract } from './markdown-source-contract';
import type { MarkdownSource } from './markdown-source-contract';

export const MarkdownSourceStub = ({ value }: { value?: string } = {}): MarkdownSource =>
  markdownSourceContract.parse(value ?? '## Gate 5\n\nAll claims verified.');
