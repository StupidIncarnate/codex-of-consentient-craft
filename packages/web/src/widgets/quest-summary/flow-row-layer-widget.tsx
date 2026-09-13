/**
 * PURPOSE: Renders one quest flow's coverage row in the verification summary — its name and flow
 * type, plus one TrackRowLayerWidget per verification track that measures it.
 *
 * USAGE:
 * <FlowRowLayerWidget flow={flow} />
 * // Renders QUEST_SUMMARY_FLOW_ROW with the flow's name/type line and its track rows
 */

import { Box, Text } from '@mantine/core';

import type { QuestSummaryFlow } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { TrackRowLayerWidget } from './track-row-layer-widget';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;

export interface FlowRowLayerWidgetProps {
  flow: QuestSummaryFlow;
}

export const FlowRowLayerWidget = ({ flow }: FlowRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box data-testid="QUEST_SUMMARY_FLOW_ROW" style={{ marginTop: ROW_GAP }}>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_FLOW_NAME"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.text, fontWeight: 600 }}
      >
        {flow.name} [{flow.flowType}]
      </Text>
      {flow.tracks.map((track) => (
        <TrackRowLayerWidget key={track.id} track={track} />
      ))}
    </Box>
  );
};
