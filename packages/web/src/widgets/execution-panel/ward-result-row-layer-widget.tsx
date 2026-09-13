/**
 * PURPOSE: Renders one ward result's exit-code line and, once the quest id is known, its fetched
 * failure detail — the single row an expanded [WARD] execution row's wardResults list maps to.
 *
 * USAGE:
 * <WardResultRowLayerWidget wardResult={wardResult} questId={questId} />
 * // Renders "Ward exit code: 1 (committed)" plus the lint/typecheck/test breakdown once it loads
 */

import { Box, Text } from '@mantine/core';

import type { QuestId, WardResult } from '@dungeonmaster/shared/contracts';

import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { WardResultDetailLayerWidget } from './ward-result-detail-layer-widget';

const DETAIL_FONT_SIZE = 10;
const DETAIL_MARGIN_BOTTOM = 4;

export interface WardResultRowLayerWidgetProps {
  wardResult: WardResult;
  questId?: QuestId;
}

export const WardResultRowLayerWidget = ({
  wardResult,
  questId,
}: WardResultRowLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Box data-testid="execution-row-ward-result" style={{ marginBottom: DETAIL_MARGIN_BOTTOM }}>
      <Text
        ff="monospace"
        style={{
          fontSize: DETAIL_FONT_SIZE,
          color: wardResult.exitCode === 0 ? colors.success : colors.danger,
        }}
      >
        Ward exit code: {String(wardResult.exitCode)}
        {wardResult.wardMode ? ` (${wardResult.wardMode})` : ''}
      </Text>
      {questId === undefined ? null : (
        <WardResultDetailLayerWidget questId={questId} wardResult={wardResult} />
      )}
    </Box>
  );
};
