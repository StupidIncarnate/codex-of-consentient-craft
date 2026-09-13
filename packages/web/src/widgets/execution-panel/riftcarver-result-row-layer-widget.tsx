/**
 * PURPOSE: Renders one riftcarver result's exit-code line and, once the quest id is known, its
 * fetched carve log — the single row an expanded [RIFTCARVER] execution row's riftcarverResults
 * list maps to.
 *
 * USAGE:
 * <RiftcarverResultRowLayerWidget riftcarverResult={riftcarverResult} questId={questId} />
 * // Renders "Riftcarver exit code: 1 (repairable)" plus the persisted carve log once it loads
 */

import { Box, Text } from '@mantine/core';

import type { QuestId, RiftcarverResult } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { RiftcarverResultDetailLayerWidget } from './riftcarver-result-detail-layer-widget';

const DETAIL_FONT_SIZE = 10;
const DETAIL_MARGIN_BOTTOM = 4;

export interface RiftcarverResultRowLayerWidgetProps {
  riftcarverResult: RiftcarverResult;
  questId?: QuestId;
}

export const RiftcarverResultRowLayerWidget = ({
  riftcarverResult,
  questId,
}: RiftcarverResultRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box
      data-testid="execution-row-riftcarver-result"
      style={{ marginBottom: DETAIL_MARGIN_BOTTOM }}
    >
      <Text
        ff="monospace"
        style={{
          fontSize: DETAIL_FONT_SIZE,
          color: riftcarverResult.exitCode === 0 ? colors.success : colors.danger,
        }}
      >
        Riftcarver exit code: {String(riftcarverResult.exitCode)} ({riftcarverResult.outcome})
      </Text>
      {questId === undefined ? null : (
        <RiftcarverResultDetailLayerWidget questId={questId} riftcarverResult={riftcarverResult} />
      )}
    </Box>
  );
};
