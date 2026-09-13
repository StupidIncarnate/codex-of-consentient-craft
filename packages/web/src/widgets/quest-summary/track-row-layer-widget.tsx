/**
 * PURPOSE: Renders one verification track's coverage row for a flow — its denominator track name and
 * its confirmed/unconfirmable/outstanding unit counts.
 *
 * USAGE:
 * <TrackRowLayerWidget track={track} />
 * // Renders QUEST_SUMMARY_TRACK_ROW with the track id and its three counts
 */

import { Box, Text } from '@mantine/core';

import type { QuestSummaryTrackCounts } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_INDENT = 10;

export interface TrackRowLayerWidgetProps {
  track: QuestSummaryTrackCounts;
}

export const TrackRowLayerWidget = ({ track }: TrackRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_SUMMARY_TRACK_ROW"
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: ROW_GAP,
        paddingLeft: ROW_INDENT,
      }}
    >
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TRACK_NAME"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], flexShrink: 0 }}
      >
        {track.id.toUpperCase()}
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TRACK_CONFIRMED"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.success, flexShrink: 0 }}
      >
        {track.confirmed} confirmed
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TRACK_UNCONFIRMABLE"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, flexShrink: 0 }}
      >
        {track.unconfirmable} unconfirmable
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TRACK_OUTSTANDING"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'], flexShrink: 0 }}
      >
        {track.outstanding} outstanding
      </Text>
    </Box>
  );
};
