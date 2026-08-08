import type { StubArgument } from '@dungeonmaster/shared/@types';

import { markdownSpanContract } from './markdown-span-contract';
import type { MarkdownSpan } from './markdown-span-contract';

export const MarkdownSpanStub = ({ ...props }: StubArgument<MarkdownSpan> = {}): MarkdownSpan =>
  markdownSpanContract.parse({ kind: 'text', text: 'plain words', ...props });

export const MarkdownBoldSpanStub = ({ ...props }: StubArgument<MarkdownSpan> = {}): MarkdownSpan =>
  markdownSpanContract.parse({ kind: 'bold', text: 'important', ...props });

export const MarkdownCodeSpanStub = ({ ...props }: StubArgument<MarkdownSpan> = {}): MarkdownSpan =>
  markdownSpanContract.parse({ kind: 'code', text: 'navigationHarness', ...props });

export const MarkdownLinkSpanStub = ({ ...props }: StubArgument<MarkdownSpan> = {}): MarkdownSpan =>
  markdownSpanContract.parse({
    kind: 'link',
    text: 'the docs',
    href: 'https://example.com',
    ...props,
  });
