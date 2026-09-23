/**
 * PURPOSE: Renders ONE verification track's coverage row for a flow — the track's name and the four
 * counts that partition its denominator. Reach for this when you have a single track's numbers;
 * `FlowRowLayerWidget` is the flow line that mounts one of these per track that measures it.
 *
 * USAGE:
 * <TrackRowLayerWidget track={track} />
 * // Renders QUEST_SUMMARY_TRACK_ROW with the uppercased track id and its four counts
 *
 * `unmet` AND `outstanding` EACH GET THEIR OWN TESTID, LABEL AND COLOUR, and never share one. A
 * session of this track looked at an `unmet` unit and left work open; nobody of this track has
 * marked an `outstanding` one at all. Collapsed into a single figure, a reader cannot tell a track
 * that tried and failed from one nothing has started — which is the question this row exists to
 * answer, so `unmet` takes `danger` (open work with a verdict behind it) against `outstanding`'s
 * `text-dim` (nobody yet).
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
        data-testid="QUEST_SUMMARY_TRACK_MET"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.success, flexShrink: 0 }}
      >
        {track.met} met
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TRACK_CANT_MEET"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.warning, flexShrink: 0 }}
      >
        {track.cantMeet} cant-meet
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_TRACK_UNMET"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.danger, flexShrink: 0 }}
      >
        {track.unmet} unmet
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
