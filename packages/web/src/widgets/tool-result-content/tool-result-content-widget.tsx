/**
 * PURPOSE: The one place a tool's ANSWER is drawn, so the three surfaces that show one — the tool
 * row, the inline result under a call, and a result whose call never arrived — cannot drift on what
 * counts as readable. Its default is deliberately to change nothing: a reply that already reads as
 * the text it is renders exactly as a bare `<Text>` would, and only a reply carrying an escaped
 * document inside JSON, or a body written as markdown, is restructured. Mount this rather than
 * `MarkdownTextWidget` directly — that one assumes its input IS markdown, and a tool result is only
 * sometimes markdown and is a build log or a diff at least as often.
 *
 * USAGE:
 * <ToolResultContentWidget content={toolResult.content} color={colors['text-dim']} />
 * // Renders the reply verbatim, or as captioned per-property units when it needs the help
 */

import { Box, Text } from '@mantine/core';

import { cssPixelsContract } from '@dungeonmaster/shared/contracts';
import type { CssPixels } from '@dungeonmaster/shared/contracts';
import type { ToolResultDisplayContent } from '../../contracts/tool-result-display-content/tool-result-display-content-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { markdownTypographyStatics } from '../../statics/markdown-typography/markdown-typography-statics';
import { parseToolResultDisplayTransformer } from '../../transformers/parse-tool-result-display/parse-tool-result-display-transformer';
import { MarkdownTextWidget } from '../markdown-text/markdown-text-widget';

export interface ToolResultContentWidgetProps {
  content: ToolResultDisplayContent;
  color: (typeof emberDepthsThemeStatics.colors)[keyof typeof emberDepthsThemeStatics.colors];
  fontSize?: CssPixels;
}

const DEFAULT_FONT_SIZE = cssPixelsContract.parse(markdownTypographyStatics.bodyFontSize);
const LABEL_FONT_WEIGHT = 600;

export const ToolResultContentWidget = ({
  content,
  color,
  fontSize = DEFAULT_FONT_SIZE,
}: ToolResultContentWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const parts = parseToolResultDisplayTransformer({ content });

  if (parts === null) {
    return (
      <Text
        data-testid="TOOL_RESULT_VERBATIM"
        ff="monospace"
        style={{ fontSize: Number(fontSize), color, whiteSpace: 'pre-wrap' }}
      >
        {content}
      </Text>
    );
  }

  return (
    <Box data-testid="TOOL_RESULT_FORMATTED">
      {parts.map((part, index) => {
        // A scalar property is one short line; captioning it on a line of its own doubles the
        // height of the reply for nothing, so only the units that actually open out get a caption
        // above them.
        const isInlineField = part.kind === 'text' && !part.text.includes('\n');

        return (
          <Box key={`${String(index)}-${part.kind}`} mb={markdownTypographyStatics.blockGap}>
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
              <MarkdownTextWidget content={part.source} />
            ) : (
              <Text
                ff="monospace"
                style={{ fontSize: Number(fontSize), color, whiteSpace: 'pre-wrap' }}
              >
                {isInlineField && part.label !== undefined
                  ? `${String(part.label)}: ${String(part.text)}`
                  : part.text}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
