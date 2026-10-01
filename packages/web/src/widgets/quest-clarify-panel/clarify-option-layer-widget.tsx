/**
 * PURPOSE: Renders one clarification option as a clickable card. Question advancement and answer
 * collection are QuestClarifyPanelWidget's job — this layer only reports which label was picked and,
 * on a multiSelect question, draws the checked state the panel hands it.
 *
 * USAGE:
 * <ClarifyOptionLayerWidget option={option} multiSelect={true} checked={false} onSelect={({ label }) => handleSelect(label)} />
 * // Renders the option's label and description, plus a top-right checkbox when multiSelect; calls
 * // onSelect with the option's label on click. The checkbox is a span inside the card's one button,
 * // so a click anywhere on the card fires onSelect exactly once.
 */

import { Text, UnstyledButton } from '#gateway/npm/mantine__core';

import type { AskUserQuestionOption } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const OPTION_FONT_SIZE = 12;
const OPTION_BORDER_RADIUS = 2;
const OPTION_PADDING_Y = 8;
const CHECKBOX_SIZE = 14;
const CHECKBOX_GLYPH_SIZE = 12;

export interface ClarifyOptionLayerWidgetProps {
  option: AskUserQuestionOption;
  multiSelect: boolean;
  checked: boolean;
  onSelect: (params: { label: AskUserQuestionOption['label'] }) => void;
}

export const ClarifyOptionLayerWidget = ({
  option,
  multiSelect,
  checked,
  onSelect,
}: ClarifyOptionLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <UnstyledButton
      data-testid="CLARIFY_OPTION"
      px="sm"
      py={OPTION_PADDING_Y}
      onClick={(): void => {
        onSelect({ label: option.label });
      }}
      style={{
        fontFamily: 'monospace',
        fontSize: OPTION_FONT_SIZE,
        color: colors.text,
        backgroundColor: colors['bg-raised'],
        border: `1px solid ${colors.border}`,
        borderRadius: OPTION_BORDER_RADIUS,
        textAlign: 'left' as const,
        position: 'relative' as const,
      }}
    >
      {multiSelect ? (
        <span
          data-testid="CLARIFY_OPTION_CHECKBOX"
          role="checkbox"
          aria-checked={checked}
          style={{
            position: 'absolute',
            top: OPTION_PADDING_Y,
            right: OPTION_PADDING_Y,
            width: CHECKBOX_SIZE,
            height: CHECKBOX_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: CHECKBOX_GLYPH_SIZE,
            lineHeight: 1,
            color: colors['bg-deep'],
            backgroundColor: checked ? colors.primary : 'transparent',
            border: `1px solid ${checked ? colors.primary : colors['text-dim']}`,
            borderRadius: OPTION_BORDER_RADIUS,
          }}
        >
          {checked ? '✓' : ''}
        </span>
      ) : null}
      <Text ff="monospace" size="xs" fw={600} style={{ color: colors['loot-gold'] }}>
        {option.label}
      </Text>
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
        {option.description}
      </Text>
    </UnstyledButton>
  );
};
