/**
 * PURPOSE: Draws one block and its inline run. Nesting is expressed as left padding read off the
 * item's own `depth`, never as nested elements, which is what lets the block list stay flat all the
 * way from the parser to the DOM.
 *
 * USAGE:
 * <MarkdownBlockLayerWidget block={{kind: 'heading', level: 2, spans: [...]}} />
 * // Renders a bold level-2 heading line
 */

import { Box, Text } from '@mantine/core';

import type { MarkdownBlock } from '../../contracts/markdown-block/markdown-block-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { markdownTypographyStatics } from '../../statics/markdown-typography/markdown-typography-statics';
import { MarkdownSpanLayerWidget } from './markdown-span-layer-widget';

export interface MarkdownBlockLayerWidgetProps {
  block: MarkdownBlock;
  // Suppresses a heading's leading gap. A document that opens on its own title would otherwise
  // start with a band of empty space inside a box already tight on height.
  isFirst?: boolean;
}

const HAIRLINE = '1px solid';
const QUOTE_BORDER = '2px solid';

export const MarkdownBlockLayerWidget = ({
  block,
  isFirst = false,
}: MarkdownBlockLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  if (block.kind === 'code-block') {
    return (
      <Box
        data-testid="MARKDOWN_CODE_BLOCK"
        mb={markdownTypographyStatics.blockGap}
        style={{
          // A block is wide enough that its outline alone delimits it, so the fill stays calm
          // here. An inline chip is two characters wide and gets no such help — that one carries
          // the heavier `border` fill instead. Same reason, opposite answer.
          backgroundColor: colors['bg-raised'],
          border: `${HAIRLINE} ${colors['text-dim']}`,
          padding: markdownTypographyStatics.blockCodePadding,
          borderRadius: markdownTypographyStatics.codeRadius,
        }}
      >
        <Text ff="monospace" size="xs" style={{ color: colors.text, whiteSpace: 'pre-wrap' }}>
          {block.content}
        </Text>
      </Box>
    );
  }

  if (block.kind === 'rule') {
    return (
      <Box
        data-testid="MARKDOWN_RULE"
        mb={markdownTypographyStatics.blockGap}
        style={{ borderTop: `${HAIRLINE} ${colors.border}` }}
      />
    );
  }

  const spanElements = block.spans.map((span, index) => (
    <MarkdownSpanLayerWidget key={`${String(index)}-${span.kind}`} span={span} />
  ));

  if (block.kind === 'heading') {
    return (
      <Text
        data-testid="MARKDOWN_HEADING"
        ff="monospace"
        fw={markdownTypographyStatics.headingWeight}
        mb={markdownTypographyStatics.blockGap}
        style={{
          fontSize:
            markdownTypographyStatics.bodyFontSize +
            Math.max(0, markdownTypographyStatics.headingFlatLevel - Number(block.level)) *
              markdownTypographyStatics.headingStep,
          color: colors.text,
          // What separates a heading here is the space ABOVE it, not its size. The ladder tops out
          // three points over body and flattens entirely at `####` (deliberately — see
          // markdownTypographyStatics), which leaves nothing for a reader to pick out of a column of
          // prose: a `##` at 14px in body colour, sitting the same 4px off the paragraph before it
          // as that paragraph sat off the one before THAT, is a bold line, not a section.
          marginTop: isFirst ? 0 : markdownTypographyStatics.headingGapTop,
          // The rule is `text-dim`, and `border` is the trap. `border` is what MARKDOWN_RULE uses
          // and reads as the matching token for a divider, but the two marks are not in the same
          // situation: a `---` is alone on its line with air above and below, while this sits tight
          // under glyphs. Measured against the surfaces markdown actually renders on, `border` is
          // 1.37:1 over `bg-surface` and 1.23:1 over the `bg-raised` of an open tool row — the same
          // range this palette already documents as "technically painted and perceptually absent"
          // (see markdown-span-layer-widget). `text-dim` is 3.71:1 on `bg-raised`, and is already
          // the token doing exactly this job as the inline code chip's outline.
          ...(Number(block.level) <= markdownTypographyStatics.headingRuleMaxLevel
            ? {
                borderBottom: `${HAIRLINE} ${colors['text-dim']}`,
                paddingBottom: markdownTypographyStatics.headingRulePadding,
              }
            : {}),
        }}
      >
        {spanElements}
      </Text>
    );
  }

  if (block.kind === 'list-item') {
    return (
      <Box
        data-testid="MARKDOWN_LIST_ITEM"
        style={{
          display: 'flex',
          gap: markdownTypographyStatics.markerGap,
          paddingLeft: Number(block.depth) * markdownTypographyStatics.indentPx,
        }}
      >
        <Text
          ff="monospace"
          size="xs"
          data-testid="MARKDOWN_LIST_MARKER"
          style={{ color: colors['text-dim'], flexShrink: 0 }}
        >
          {block.marker}
        </Text>
        <Text ff="monospace" size="xs" style={{ color: colors.text }}>
          {spanElements}
        </Text>
      </Box>
    );
  }

  if (block.kind === 'quote') {
    return (
      <Box
        data-testid="MARKDOWN_QUOTE"
        mb={markdownTypographyStatics.blockGap}
        style={{
          borderLeft: `${QUOTE_BORDER} ${colors.border}`,
          paddingLeft: markdownTypographyStatics.quotePadding,
        }}
      >
        <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
          {spanElements}
        </Text>
      </Box>
    );
  }

  return (
    <Text
      data-testid="MARKDOWN_PARAGRAPH"
      ff="monospace"
      size="xs"
      mb={markdownTypographyStatics.blockGap}
      style={{ color: colors.text }}
    >
      {spanElements}
    </Text>
  );
};
