/**
 * PURPOSE: Renders one argument of an expanded tool row — the inline `key: value` form for a
 * single-line value, or the code-surface block form for a document (any multi-line value, plus
 * Bash's `command`, which earns the surface without wrapping). Owns its own show-more state per
 * field rather than an index-keyed record in the parent, so a field's disclosure survives the list
 * reordering that an index would not.
 *
 * USAGE:
 * <ToolRowFieldLayerWidget field={field} toolName={toolName} holdAnchor={holdAnchor} />
 * // Renders the field inline or as a captioned code block, each with its own expand/collapse
 */

import { Box, Text } from '@mantine/core';
import { useState } from 'react';

import { cssPixelsContract } from '@dungeonmaster/shared/contracts';
import type { FormattedToolField } from '../../contracts/formatted-tool-field/formatted-tool-field-contract';
import type { ToolName } from '../../contracts/tool-name/tool-name-contract';
import { toolResultDisplayContentContract } from '../../contracts/tool-result-display-content/tool-result-display-content-contract';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { elideMiddleTransformer } from '../../transformers/elide-middle/elide-middle-transformer';
import { ToolResultContentWidget } from '../tool-result-content/tool-result-content-widget';

const DETAIL_FONT_SIZE = 10;
const RESULT_FONT_SIZE = cssPixelsContract.parse(DETAIL_FONT_SIZE);

export interface ToolRowFieldLayerWidgetProps {
  field: FormattedToolField;
  toolName: ToolName;
  // The row header's own anchor from `useDisclosureAnchorBinding`, called before every toggle here
  // changes height. A row can carry several of these fields, and the header is the one element in
  // the row there is exactly one of — so every field toggle anchors THAT, not itself.
  holdAnchor: () => void;
}

export const ToolRowFieldLayerWidget = ({
  field,
  toolName,
  holdAnchor,
}: ToolRowFieldLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const [isFieldExpanded, setIsFieldExpanded] = useState(false);
  const isMultiLine = field.value.includes('\n');
  // A shell command takes the code surface whether or not it wraps: it is a literal
  // the reader may copy, and a one-line `npm run ward` already rendered there. Every
  // other argument earns that surface by BEING a document — a one-line value has no
  // structure for the surface to preserve, and boxing it costs a row of chrome to
  // repeat what the inline form already said.
  const isBlockField = isMultiLine || (toolName === 'Bash' && field.key === 'command');

  if (isBlockField) {
    // Cut by LINE first, so the preview is a shorter document rather than a fragment
    // stopping mid-heading — this string is parsed as markdown downstream, and half a
    // mark renders as the wrong mark. The character ceiling only catches the file
    // that offers no line break to cut on, such as a minified bundle.
    const preview = field.value
      .split('\n')
      .slice(0, contentTruncationConfigStatics.blockFieldLineLimit)
      .join('\n')
      .slice(0, contentTruncationConfigStatics.blockFieldCharLimit);
    // The preview is a prefix of the value, so a shorter one is a truncated one.
    const isPreviewShort = preview.length < field.value.length;

    return (
      <Box data-testid="TOOL_ROW_BLOCK_FIELD">
        {isMultiLine ? (
          <Text
            ff="monospace"
            fw={600}
            data-testid="TOOL_ROW_FIELD_LABEL"
            style={{
              fontSize: DETAIL_FONT_SIZE,
              color: colors['text-dim'],
              marginBottom: 2,
            }}
          >
            {field.key}
          </Text>
        ) : null}
        <Box
          style={{
            backgroundColor: colors['bg-deep'],
            padding: '3px 6px',
            borderRadius: 2,
            marginBottom: 2,
          }}
        >
          <ToolResultContentWidget
            content={toolResultDisplayContentContract.parse(
              isFieldExpanded ? field.value : preview,
            )}
            color={colors['text-dim']}
            fontSize={RESULT_FONT_SIZE}
          />
        </Box>
        {isPreviewShort ? (
          <Text
            ff="monospace"
            data-testid="TOOL_ROW_FIELD_TOGGLE"
            style={{
              fontSize: DETAIL_FONT_SIZE,
              color: colors.primary,
              cursor: 'pointer',
            }}
            onClick={() => {
              holdAnchor();
              setIsFieldExpanded(!isFieldExpanded);
            }}
          >
            {isFieldExpanded ? 'show less' : 'show more'}
          </Text>
        ) : null}
      </Box>
    );
  }

  return (
    <Text
      ff="monospace"
      data-testid="TOOL_ROW_FIELD_INLINE"
      style={{
        fontSize: DETAIL_FONT_SIZE,
        color: colors['text-dim'],
        fontStyle: 'italic',
      }}
    >
      {field.key}:{' '}
      {field.isLong && !isFieldExpanded
        ? String(
            elideMiddleTransformer({
              text: field.value,
              limit: contentTruncationConfigStatics.longFieldLimit,
            }),
          )
        : field.value}
      {field.isLong ? (
        <Text
          component="span"
          ff="monospace"
          data-testid="TOOL_ROW_FIELD_TOGGLE"
          style={{
            fontSize: DETAIL_FONT_SIZE,
            color: colors.primary,
            cursor: 'pointer',
            marginLeft: 4,
          }}
          onClick={() => {
            holdAnchor();
            setIsFieldExpanded(!isFieldExpanded);
          }}
        >
          {isFieldExpanded ? 'show less' : 'show more'}
        </Text>
      ) : null}
    </Text>
  );
};
