/**
 * PURPOSE: The one place agent-authored markdown becomes formatted output. Mount this wherever a
 * message written BY a model is displayed; leave plain `<Text>` in place for anything the app
 * itself composes, where markdown characters are literal and rendering them would be a lie about
 * what the agent said.
 *
 * USAGE:
 * <MarkdownTextWidget content={markdownSourceContract.parse(entry.content)} />
 * // Renders headings, lists, fences, and inline code from the raw message text
 */

import { Box } from '@mantine/core';

import type { MarkdownSource } from '../../contracts/markdown-source/markdown-source-contract';
import { parseMarkdownBlocksTransformer } from '../../transformers/parse-markdown-blocks/parse-markdown-blocks-transformer';
import { MarkdownBlockLayerWidget } from './markdown-block-layer-widget';

export interface MarkdownTextWidgetProps {
  content: MarkdownSource;
}

export const MarkdownTextWidget = ({ content }: MarkdownTextWidgetProps): React.JSX.Element => {
  const blocks = parseMarkdownBlocksTransformer({ text: content });

  return (
    <Box data-testid="MARKDOWN_TEXT">
      {blocks.map((block, index) => (
        <MarkdownBlockLayerWidget
          key={`${String(index)}-${block.kind}`}
          block={block}
          isFirst={index === 0}
        />
      ))}
    </Box>
  );
};
