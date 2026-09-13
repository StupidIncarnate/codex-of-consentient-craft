/**
 * PURPOSE: Renders one clarification option as a clickable card. Question advancement and answer
 * collection are QuestClarifyPanelWidget's job — this layer only reports which label was picked.
 *
 * USAGE:
 * <ClarifyOptionLayerWidget option={option} onSelect={({ label }) => handleSelect(label)} />
 * // Renders the option's label and description; calls onSelect with the option's label on click
 */

import { Text, UnstyledButton } from '@mantine/core';

import type { AskUserQuestionOption } from '@dungeonmaster/shared/contracts';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const OPTION_FONT_SIZE = 12;
const OPTION_BORDER_RADIUS = 2;
const OPTION_PADDING_Y = 8;

export interface ClarifyOptionLayerWidgetProps {
  option: AskUserQuestionOption;
  onSelect: (params: { label: AskUserQuestionOption['label'] }) => void;
}

export const ClarifyOptionLayerWidget = ({
  option,
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
      }}
    >
      <Text ff="monospace" size="xs" fw={600} style={{ color: colors['loot-gold'] }}>
        {option.label}
      </Text>
      <Text ff="monospace" size="xs" style={{ color: colors['text-dim'] }}>
        {option.description}
      </Text>
    </UnstyledButton>
  );
};
