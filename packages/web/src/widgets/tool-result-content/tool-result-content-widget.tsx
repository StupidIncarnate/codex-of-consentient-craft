/**
 * PURPOSE: The one place a tool's PAYLOAD is drawn, so the four surfaces carrying one — the tool
 * row's result, the inline result under a call, a result whose call never arrived, and a multi-line
 * ARGUMENT the call was made with — cannot drift on what counts as readable. A Write's file body
 * and a `get-quest` reply pose the same question, so they get the same answer. Its default is
 * deliberately to change nothing: a payload that already reads as the text it is renders exactly as
 * a bare `<Text>` would, and only one carrying an escaped document inside JSON, or a body written
 * as markdown, is restructured. Mount this rather than `MarkdownTextWidget` directly — that one
 * assumes its input IS markdown, and a payload is only sometimes markdown and is a build log, a
 * diff or a TypeScript file at least as often.
 *
 * USAGE:
 * <ToolResultContentWidget content={toolResult.content} color={colors['text-dim']} />
 * // Renders the payload verbatim, or as captioned per-property units when it needs the help
 */

import { Box, Text } from '@mantine/core';

import { cssPixelsContract } from '@dungeonmaster/shared/contracts';
import type { CssPixels } from '@dungeonmaster/shared/contracts';
import type { ToolResultDisplayContent } from '../../contracts/tool-result-display-content/tool-result-display-content-contract';
import type { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { markdownTypographyStatics } from '../../statics/markdown-typography/markdown-typography-statics';
import { parseToolResultDisplayTransformer } from '../../transformers/parse-tool-result-display/parse-tool-result-display-transformer';
import { ToolResultPartLayerWidget } from './tool-result-part-layer-widget';

export interface ToolResultContentWidgetProps {
  content: ToolResultDisplayContent;
  color: (typeof emberDepthsThemeStatics.colors)[keyof typeof emberDepthsThemeStatics.colors];
  fontSize?: CssPixels;
}

const DEFAULT_FONT_SIZE = cssPixelsContract.parse(markdownTypographyStatics.bodyFontSize);

export const ToolResultContentWidget = ({
  content,
  color,
  fontSize = DEFAULT_FONT_SIZE,
}: ToolResultContentWidgetProps): React.JSX.Element => {
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
      {parts.map((part, index) => (
        <ToolResultPartLayerWidget
          key={`${String(index)}-${part.kind}`}
          part={part}
          color={color}
          fontSize={fontSize}
        />
      ))}
    </Box>
  );
};
