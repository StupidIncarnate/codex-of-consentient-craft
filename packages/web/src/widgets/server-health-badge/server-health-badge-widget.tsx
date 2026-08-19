/**
 * PURPOSE: The header's one-line server-status readout, in the opposite corner from the rate-limit
 * cards. When the server cannot be reached it shortens its bracketed monospace line and prefixes a
 * sad-raccoon sprite, so the failure state is legible at a glance rather than a blank corner.
 *
 * USAGE:
 * <ServerHealthBadgeWidget />
 * // Renders '[ ONLINE · 12m · v0.1.0 ]' or a sad raccoon plus '[ OFFLINE ]', both linking to /health
 */

import { Box, Text } from '@mantine/core';
import { Link } from 'react-router-dom';

import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { sadRaccoonPixelsStatics } from '../../statics/sad-raccoon-pixels/sad-raccoon-pixels-statics';
import { useHealthBinding } from '../../bindings/use-health/use-health-binding';
import { formatUptimeTransformer } from '../../transformers/format-uptime/format-uptime-transformer';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';

const BADGE_SPRITE_SCALE = 2;

const sadRaccoonPixels = sadRaccoonPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

export const ServerHealthBadgeWidget = (): React.JSX.Element | null => {
  const { snapshot, isLoading } = useHealthBinding();
  const { colors } = emberDepthsThemeStatics;

  if (isLoading) {
    return null;
  }

  const isOffline = snapshot === null;
  const badgeText = isOffline
    ? '[ OFFLINE ]'
    : `[ ONLINE · ${formatUptimeTransformer({ seconds: Number(snapshot.uptimeSeconds) })} · v${snapshot.version} ]`;

  return (
    <Link to="/health" style={{ textDecoration: 'none' }} data-testid="SERVER_HEALTH_BADGE_LINK">
      <Box
        data-testid="SERVER_HEALTH_BADGE"
        data-health-state={isOffline ? 'offline' : 'online'}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {isOffline ? (
          <PixelSpriteWidget
            pixels={sadRaccoonPixels}
            scale={BADGE_SPRITE_SCALE as PixelDimension}
            width={sadRaccoonPixelsStatics.dimensions.width as PixelDimension}
            height={sadRaccoonPixelsStatics.dimensions.height as PixelDimension}
          />
        ) : null}
        <Text
          ff="monospace"
          size="xs"
          style={{
            color: isOffline ? colors.danger : colors['text-dim'],
            whiteSpace: 'nowrap',
          }}
        >
          {badgeText}
        </Text>
      </Box>
    </Link>
  );
};
