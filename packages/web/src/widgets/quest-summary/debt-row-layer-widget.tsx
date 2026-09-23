/**
 * PURPOSE: Renders ONE debt entry's row in the verification summary — the mark that says why the
 * unit is not proven, the track and unit it belongs to, the evidence behind it, and either the
 * action that would settle it or the line saying nothing hands it over. Reach for this when you
 * have a single entry of the summary's debt list; `QuestSummaryWidget` is the panel that mounts one
 * of these per entry.
 *
 * USAGE:
 * <DebtRowLayerWidget entry={entry} />
 * // Renders QUEST_SUMMARY_DEBT_ROW with the mark/track/unit line, the evidence, and one of
 * // QUEST_SUMMARY_DEBT_TO_SETTLE or QUEST_SUMMARY_DEBT_SUCCESSOR
 *
 * THE THIRD LINE IS ALWAYS THERE, and which one it is IS the difference between the two marks.
 * `cant-meet` carries a `toSettle` and this layer prints it; `unmet` is refused one by the contract,
 * because work is outstanding and a successor is owed it rather than a reader being handed an
 * instruction. Rendering nothing on `unmet` leaves a blank a reader cannot tell from a `cant-meet`
 * whose handover went missing, so the absence gets a line of its own.
 *
 * ONE UNIT CAN OWN SEVERAL OF THESE ROWS. An entry's `id` is `<unitId>:<track>`, and the tracks
 * measure independently — so the mark and the track both belong on the unit line, or two rows over
 * the same unit read as duplicates of each other.
 */

import { Box, Text } from '@mantine/core';

import type { QuestSummaryDebt } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_INDENT = 10;

export interface DebtRowLayerWidgetProps {
  entry: QuestSummaryDebt;
}

export const DebtRowLayerWidget = ({ entry }: DebtRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_SUMMARY_DEBT_ROW"
      style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
    >
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_DEBT_UNIT"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, fontWeight: 600 }}
      >
        [{entry.mark}] [{entry.track}] {entry.unitId}
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_DEBT_EVIDENCE"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
      >
        {entry.evidence}
      </Text>
      {entry.toSettle === undefined ? (
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_DEBT_SUCCESSOR"
          style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'] }}
        >
          → nothing hands this over; a successor is owed the work
        </Text>
      ) : (
        <Text
          ff="monospace"
          data-testid="QUEST_SUMMARY_DEBT_TO_SETTLE"
          style={{ fontSize: ROW_FONT_SIZE, color: colors.primary }}
        >
          → {entry.toSettle}
        </Text>
      )}
    </Box>
  );
};
