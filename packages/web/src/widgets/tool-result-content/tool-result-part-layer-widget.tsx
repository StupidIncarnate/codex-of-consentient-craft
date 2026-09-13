/**
 * PURPOSE: Renders one unit of a formatted tool result — a captioned property lifted out of an
 * escaped-JSON reply, or a fragment of a body authored as markdown. Extracted from
 * `ToolResultContentWidget`'s part map so the caption-suppression rule for a short scalar lives
 * beside the markup it governs.
 *
 * USAGE:
 * <ToolResultPartLayerWidget part={part} color={colors['text-dim']} fontSize={fontSize} />
 * // Renders the part's caption (when it has one and needs it) plus its markdown or plain text
 */

import { Box, Text } from '@mantine/core';

import type { CssPixels } from '@dungeonmaster/shared/contracts';
import type { ToolResultPart } from '../../contracts/tool-result-part/tool-result-part-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { markdownTypographyStatics } from '../../statics/markdown-typography/markdown-typography-statics';
import { MarkdownTextWidget } from '../markdown-text/markdown-text-widget';

const LABEL_FONT_WEIGHT = 600;

export interface ToolResultPartLayerWidgetProps {
  part: ToolResultPart;
  color: (typeof emberDepthsThemeStatics.colors)[keyof typeof emberDepthsThemeStatics.colors];
  fontSize: CssPixels;
}

export const ToolResultPartLayerWidget = ({
  part,
  color,
  fontSize,
}: ToolResultPartLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // A scalar property is one short line; captioning it on a line of its own doubles the
  // height of the reply for nothing, so only the units that actually open out get a caption
  // above them.
  const isInlineField = part.kind === 'text' && !part.text.includes('\n');

  return (
    <Box data-testid="TOOL_RESULT_PART" mb={markdownTypographyStatics.blockGap}>
      {part.label === undefined || isInlineField ? null : (
        <Text
          data-testid="TOOL_RESULT_FIELD_LABEL"
          ff="monospace"
          fw={LABEL_FONT_WEIGHT}
          style={{ fontSize: Number(fontSize), color: colors['text-dim'] }}
        >
          {part.label}
        </Text>
      )}
      {part.kind === 'markdown' ? (
        // A tool's answer is machine-formatted: its newlines and indentation are what say one
        // logical item ended and which continuations belong to it. Rejoining them the way an
        // agent's hard-wrapped prose wants turns a quest's contract ledger into a single
        // run-on sentence with every nesting level flattened out of it.
        <MarkdownTextWidget content={part.source} preserveLineBreaks={true} />
      ) : (
        <Text ff="monospace" style={{ fontSize: Number(fontSize), color, whiteSpace: 'pre-wrap' }}>
          {isInlineField && part.label !== undefined
            ? `${String(part.label)}: ${String(part.text)}`
            : part.text}
        </Text>
      )}
    </Box>
  );
};
