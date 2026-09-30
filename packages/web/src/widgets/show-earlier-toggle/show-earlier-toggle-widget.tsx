/**
 * PURPOSE: Renders the "▸ Show N earlier entries" / "▾ Hide N earlier entries" toggle row used by chains that collapse to their tail by default
 *
 * USAGE:
 * <ShowEarlierToggleWidget hiddenCount={tailIndex} expanded={showAllEarlier} onToggle={() => setShowAll(!showAll)} testId={chatListShowEarlierToggleTestIdContract.parse('CHAT_LIST_SHOW_EARLIER_TOGGLE')} />
 * // Renders one clickable row; calls onToggle when clicked.
 */

import { Box, Text } from '#gateway/npm/mantine__core';

import { useDisclosureAnchorBinding } from '../../bindings/use-disclosure-anchor/use-disclosure-anchor-binding';
import type { ToggleTestId } from '../../contracts/toggle-test-id/toggle-test-id-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

export interface ShowEarlierToggleWidgetProps {
  hiddenCount: number;
  expanded: boolean;
  onToggle: () => void;
  testId: ToggleTestId;
}

export const ShowEarlierToggleWidget = ({
  hiddenCount,
  expanded,
  onToggle,
  testId,
}: ShowEarlierToggleWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  // Owned here rather than by each caller, because both of them (the chat list and a sub-agent
  // chain) render this row ABOVE the entries it reveals — so the row itself never moves, and the
  // whole job is stopping the auto-scroll from throwing the reader to the end of what just opened.
  const { anchorRef, holdAnchor } = useDisclosureAnchorBinding();
  const numericCount = hiddenCount;
  const noun = numericCount === 1 ? 'entry' : 'entries';
  const label = expanded
    ? `▾ Hide ${String(numericCount)} earlier ${noun}`
    : `▸ Show ${String(numericCount)} earlier ${noun}`;

  return (
    <Box
      ref={anchorRef}
      data-testid={testId}
      onClick={(): void => {
        holdAnchor();
        onToggle();
      }}
      style={{
        cursor: 'pointer',
        userSelect: 'none',
        padding: '2px 6px',
      }}
    >
      <Text ff="monospace" size="xs" style={{ color: colors.primary }}>
        {label}
      </Text>
    </Box>
  );
};
