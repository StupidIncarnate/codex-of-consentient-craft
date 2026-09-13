/**
 * PURPOSE: Renders one mid-quest observable's row in the verification summary — who added it, its
 * flow/node anchor, and its description text verbatim.
 *
 * USAGE:
 * <ObservableRowLayerWidget observable={observable} />
 * // Renders QUEST_SUMMARY_OBSERVABLE_ROW with the added-by, anchor and description lines
 */

import { Box, Text } from '@mantine/core';

import type { QuestSummaryObservable } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ROW_FONT_SIZE = 10;
const ROW_GAP = 6;
const ROW_INDENT = 10;

export interface ObservableRowLayerWidgetProps {
  observable: QuestSummaryObservable;
}

export const ObservableRowLayerWidget = ({
  observable,
}: ObservableRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="QUEST_SUMMARY_OBSERVABLE_ROW"
      style={{ paddingLeft: ROW_INDENT, marginTop: ROW_GAP }}
    >
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_OBSERVABLE_ADDED_BY"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['loot-rare'], fontWeight: 600 }}
      >
        added by {observable.addedBy}
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_OBSERVABLE_ANCHOR"
        style={{ fontSize: ROW_FONT_SIZE, color: colors['text-dim'] }}
      >
        {observable.flowId} / {observable.nodeId} [{observable.observableType}]
      </Text>
      <Text
        ff="monospace"
        data-testid="QUEST_SUMMARY_OBSERVABLE_DESCRIPTION"
        style={{ fontSize: ROW_FONT_SIZE, color: colors.text }}
      >
        {observable.description}
      </Text>
    </Box>
  );
};
