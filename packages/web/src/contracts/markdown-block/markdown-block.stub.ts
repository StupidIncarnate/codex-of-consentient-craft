import type { StubArgument } from '@dungeonmaster/shared/@types';

import { markdownBlockContract } from './markdown-block-contract';
import type { MarkdownBlock } from './markdown-block-contract';

export const MarkdownBlockStub = ({ ...props }: StubArgument<MarkdownBlock> = {}): MarkdownBlock =>
  markdownBlockContract.parse({
    kind: 'paragraph',
    spans: [{ kind: 'text', text: 'plain words' }],
    ...props,
  });

export const MarkdownHeadingBlockStub = ({
  ...props
}: StubArgument<MarkdownBlock> = {}): MarkdownBlock =>
  markdownBlockContract.parse({
    kind: 'heading',
    level: 2,
    spans: [{ kind: 'text', text: 'Gate 5' }],
    ...props,
  });

export const MarkdownListItemBlockStub = ({
  ...props
}: StubArgument<MarkdownBlock> = {}): MarkdownBlock =>
  markdownBlockContract.parse({
    kind: 'list-item',
    marker: '•',
    depth: 0,
    spans: [{ kind: 'text', text: 'first item' }],
    ...props,
  });

export const MarkdownCodeBlockStub = ({
  ...props
}: StubArgument<MarkdownBlock> = {}): MarkdownBlock =>
  markdownBlockContract.parse({
    kind: 'code-block',
    language: 'typescript',
    content: 'const x = 1;',
    ...props,
  });
