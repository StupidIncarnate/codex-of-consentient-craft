/**
 * PURPOSE: Draws one inline mark. Every branch renders a `span`-like element with no margin, so a
 * run of spans reflows as ordinary text rather than as a row of boxes — which is what lets a
 * paragraph wrap mid-sentence with a code mark in it.
 *
 * USAGE:
 * <MarkdownSpanLayerWidget span={{kind: 'code', text: 'nav'}} />
 * // Renders `nav` as body text on an inset chip
 */

import { Text } from '@mantine/core';

import type { MarkdownSpan } from '../../contracts/markdown-span/markdown-span-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { markdownTypographyStatics } from '../../statics/markdown-typography/markdown-typography-statics';

export interface MarkdownSpanLayerWidgetProps {
  span: MarkdownSpan;
}

const HAIRLINE = '1px solid';

export const MarkdownSpanLayerWidget = ({
  span,
}: MarkdownSpanLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  if (span.kind === 'code') {
    return (
      <Text
        component="code"
        ff="monospace"
        size="xs"
        data-testid="MARKDOWN_CODE"
        style={{
          // Marked by fill and outline, never by an accent colour: agent prose backticks
          // constantly, so colouring code fires on every identifier at once and the message reads
          // as highlighter.
          //
          // Both of these are load-bearing, and the numbers are why. A message renders over
          // `bg-surface` (#1a110d). `bg-raised` (#2a1a14) against it is a contrast ratio of
          // 1.13:1 — a chip that is technically painted and perceptually absent. `border`
          // (#3d2a1e) is the first token far enough up to register as a fill, and the `text-dim`
          // outline is what makes a two-character chip legible as a chip rather than as a smudge.
          // Do not "calm this down" by stepping the fill back toward the message; that is how it
          // vanished before, and every test still passed while it did.
          backgroundColor: colors.border,
          border: `${HAIRLINE} ${colors['text-dim']}`,
          color: colors.text,
          padding: markdownTypographyStatics.inlineCodePadding,
          borderRadius: markdownTypographyStatics.codeRadius,
        }}
      >
        {span.text}
      </Text>
    );
  }

  if (span.kind === 'link') {
    return (
      <Text
        component="a"
        href={span.href}
        target="_blank"
        rel="noreferrer"
        ff="monospace"
        size="xs"
        data-testid="MARKDOWN_LINK"
        style={{ color: colors.primary, textDecoration: 'underline' }}
      >
        {span.text}
      </Text>
    );
  }

  if (span.kind === 'bold') {
    return (
      <Text
        component="span"
        ff="monospace"
        size="xs"
        fw={markdownTypographyStatics.boldWeight}
        data-testid="MARKDOWN_BOLD"
        style={{ color: colors.text }}
      >
        {span.text}
      </Text>
    );
  }

  if (span.kind === 'italic') {
    return (
      <Text
        component="span"
        ff="monospace"
        size="xs"
        data-testid="MARKDOWN_ITALIC"
        style={{ color: colors.text, fontStyle: 'italic' }}
      >
        {span.text}
      </Text>
    );
  }

  return (
    <Text
      component="span"
      ff="monospace"
      size="xs"
      data-testid="MARKDOWN_TEXT_SPAN"
      style={{ color: colors.text }}
    >
      {span.text}
    </Text>
  );
};
