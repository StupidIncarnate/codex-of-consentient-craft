/**
 * PURPOSE: Renders one `unconfirmable` sign-off's row in the verification summary — the unit and
 * track that could not confirm it, the evidence text, and (when carried) the action that would
 * settle it.
 *
 * USAGE:
 * <UnconfirmableRowLayerWidget entry={entry} />
 * // Renders QUEST_SUMMARY_UNCONFIRMABLE_ROW with the unit, reason and optional to-settle lines
 */

import { Box, Text } from '@mantine/core';

import type { QuestSummaryUnconfirmable } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_INDENT = 10;

export interface UnconfirmableRowLayerWidgetProps {
  entry: QuestSummaryUnconfirmable;
}

export const UnconfirmableRowLayerWidget = ({
  entry,
}: UnconfirmableRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_SUMMARY_UNCONFIRMABLE_ROW"
      style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
    >
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_UNCONFIRMABLE_UNIT"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, fontWeight: 600 }}
      >
        [{entry.track}] {entry.unitId}
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_UNCONFIRMABLE_REASON"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
      >
        {entry.signoff.evidence}
      </Text>
      {/* `toSettle` is required by the contract on this verdict, but it is optional on the
          Signoff shape itself, so the absent case renders nothing rather than an empty row. */}
      {entry.signoff.toSettle === undefined ? null : (
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_UNCONFIRMABLE_TO_SETTLE"
          style={{ fontSize: ROW_FONT_SIZE, color: colors.primary }}
        >
          → {entry.signoff.toSettle}
        </Text>
      )}
    </Box>
  );
};
