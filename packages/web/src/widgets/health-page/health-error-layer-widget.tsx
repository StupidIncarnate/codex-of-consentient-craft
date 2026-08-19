/**
 * PURPOSE: Renders the /health page's failure state — a non-200, an unparseable body, a refused
 * connection, or a WebSocket close all land here. Split from `HealthPageWidget` because this layer
 * takes the failure message as a prop and calls no binding — the page widget owns the fetch and
 * hands the message down, so this layer stays a pure function of its props and is trivial to test.
 *
 * USAGE:
 * <HealthErrorLayerWidget message={message} onRetry={refresh} />
 * // Renders a large sad raccoon, a three-word status label, the raw message beneath it, and RETRY
 */

import { Stack, Text } from '@mantine/core';

import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { buttonLabelContract } from '../../contracts/button-label/button-label-contract';
import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { sadRaccoonPixelsStatics } from '../../statics/sad-raccoon-pixels/sad-raccoon-pixels-statics';
import { healthErrorLabelTransformer } from '../../transformers/health-error-label/health-error-label-transformer';
import { PixelBtnWidget } from '../pixel-btn/pixel-btn-widget';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';

const ERROR_SPRITE_SCALE = 8;
const STATUS_FONT_SIZE = 16;
const DETAIL_FONT_SIZE = 12;
const PANEL_GAP = 16;
const PANEL_PADDING = 24;

const sadRaccoonPixels = sadRaccoonPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

export interface HealthErrorLayerWidgetProps {
  message: ErrorMessage;
  onRetry: () => void;
}

export const HealthErrorLayerWidget = ({
  message,
  onRetry,
}: HealthErrorLayerWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;

  return (
    <Stack
      align="center"
      gap={PANEL_GAP}
      data-testid="HEALTH_PAGE_ERROR"
      style={{
        padding: PANEL_PADDING,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors['bg-surface'],
      }}
    >
      <div data-testid="HEALTH_PAGE_SAD_RACCOON">
        <PixelSpriteWidget
          pixels={sadRaccoonPixels}
          scale={ERROR_SPRITE_SCALE as PixelDimension}
          width={sadRaccoonPixelsStatics.dimensions.width as PixelDimension}
          height={sadRaccoonPixelsStatics.dimensions.height as PixelDimension}
        />
      </div>
      <Text
        ff="monospace"
        fw={700}
        size={`${STATUS_FONT_SIZE}px`}
        c={colors.danger}
        data-testid="HEALTH_PAGE_ERROR_STATUS"
      >
        {healthErrorLabelTransformer({ message })}
      </Text>
      <Text
        ff="monospace"
        size={`${DETAIL_FONT_SIZE}px`}
        c={colors['text-dim']}
        data-testid="HEALTH_PAGE_ERROR_DETAIL"
      >
        {message}
      </Text>
      <div data-testid="HEALTH_PAGE_RETRY">
        <PixelBtnWidget label={buttonLabelContract.parse('RETRY')} onClick={onRetry} />
      </div>
    </Stack>
  );
};
