/**
 * PURPOSE: Renders the DUNGEONMASTER ASCII art logo flanked by fireball pixel sprites
 *
 * USAGE:
 * <LogoWidget />
 * // Renders the full logo with fireballs on both sides
 */

import { Group } from '@mantine/core';

import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { fireballPixelsStatics } from '../../statics/fireball-pixels/fireball-pixels-statics';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';

const LOGO_FONT_SIZE = '7px';
const LOGO_LINE_HEIGHT = 1.15;
const LOGO_GAP = 40;
const SPRITE_SCALE = 4;

const spritePixels = fireballPixelsStatics.pixels.map((p) => pixelCoordinateContract.parse(p));

const logo = `\
██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ███████╗ ██████╗ ███╗   ██╗███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██╔══██╗██║   ██║████╗  ██║██╔════╝ ██╔════╝██╔═══██╗████╗  ██║████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║  ██║██║   ██║██╔██╗ ██║██║  ███╗█████╗  ██║   ██║██╔██╗ ██║██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██║  ██║██║   ██║██║╚██╗██║██║   ██║██╔══╝  ██║   ██║██║╚██╗██║██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝███████╗╚██████╔╝██║ ╚████║██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝`;

export const LogoWidget = (): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const { dimensions } = fireballPixelsStatics;
  const spriteScale = SPRITE_SCALE as PixelDimension;
  const spriteWidth = dimensions.width as PixelDimension;
  const spriteHeight = dimensions.height as PixelDimension;

  return (
    <Group align="center" gap={LOGO_GAP} data-testid="LOGO_GROUP">
      <PixelSpriteWidget
        pixels={spritePixels}
        scale={spriteScale}
        width={spriteWidth}
        height={spriteHeight}
      />
      <pre
        data-testid="LOGO_ASCII"
        style={{
          color: colors.primary,
          fontFamily: 'monospace',
          fontSize: LOGO_FONT_SIZE,
          lineHeight: LOGO_LINE_HEIGHT,
          margin: 0,
          whiteSpace: 'pre',
        }}
      >
        {logo}
      </pre>
      <PixelSpriteWidget
        pixels={spritePixels}
        scale={spriteScale}
        width={spriteWidth}
        height={spriteHeight}
        flip={true}
      />
    </Group>
  );
};
