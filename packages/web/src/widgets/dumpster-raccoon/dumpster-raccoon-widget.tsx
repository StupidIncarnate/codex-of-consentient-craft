/**
 * PURPOSE: Displays raccoon wizard and dumpster fire sprites side-by-side with idle animations, in
 * one of two roles. By default it stands in for a panel that has nothing to show yet: it fills the
 * space and says so. As an `ornament` it sits above a panel that DOES have content, so it claims
 * only its sprites' height and drops both the caption (nothing is loading) and the surface fill
 * (sharing `bg-surface` with the panel below is what made the two read as a single box).
 *
 * USAGE:
 * <DumpsterRaccoonWidget />
 * // Fills its parent on bg-surface, captioned, as a loading placeholder
 *
 * <DumpsterRaccoonWidget ornament />
 * // Sprites only, transparent, sized to content — a header above a populated panel
 */

import { Box, Group, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { pixelCoordinateContract } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';
import { dumpsterFirePixelsStatics } from '../../statics/dumpster-fire-pixels/dumpster-fire-pixels-statics';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { raccoonWizardPixelsStatics } from '../../statics/raccoon-wizard-pixels/raccoon-wizard-pixels-statics';
import { PixelSpriteWidget } from '../pixel-sprite/pixel-sprite-widget';

const RACCOON_FLIP_INTERVAL_MS = 2500;
const FLAME_FRAME_INTERVAL_MS = 300;
const RACCOON_SCALE = 8;
const FIRE_SCALE = 6;
const ORNAMENT_PADDING = 12;

const raccoonPixels = raccoonWizardPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

const fireFrameA = dumpsterFirePixelsStatics.frameA.map((p) => pixelCoordinateContract.parse(p));

const fireFrameB = dumpsterFirePixelsStatics.frameB.map((p) => pixelCoordinateContract.parse(p));

export interface DumpsterRaccoonWidgetProps {
  ornament?: boolean;
}

export const DumpsterRaccoonWidget = ({
  ornament = false,
}: DumpsterRaccoonWidgetProps = {}): React.JSX.Element => {
  const [flipped, setFlipped] = useState(false);
  const [flameFrame, setFlameFrame] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFlipped((f) => !f);
    }, RACCOON_FLIP_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setFlameFrame((f) => !f);
    }, FLAME_FRAME_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <Box
      data-testid="dumpster-raccoon-widget"
      style={{
        // As an ornament it must NOT stretch and must NOT paint a surface: it is stacked directly
        // above a `bg-surface` panel, and matching that fill is exactly what made the pair read as
        // one box with the sprites floating inside it.
        flex: ornament ? '0 0 auto' : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ornament ? 'transparent' : emberDepthsThemeStatics.colors['bg-surface'],
        padding: ornament ? ORNAMENT_PADDING : 0,
        gap: 8,
      }}
    >
      <Group gap={0} align="flex-end">
        <Box style={{ position: 'relative', zIndex: 1, marginRight: 12 }}>
          <PixelSpriteWidget
            pixels={raccoonPixels}
            scale={RACCOON_SCALE as PixelDimension}
            width={raccoonWizardPixelsStatics.dimensions.width as PixelDimension}
            height={raccoonWizardPixelsStatics.dimensions.height as PixelDimension}
            flip={flipped}
          />
        </Box>
        <PixelSpriteWidget
          pixels={flameFrame ? fireFrameB : fireFrameA}
          scale={FIRE_SCALE as PixelDimension}
          width={dumpsterFirePixelsStatics.dimensions.width as PixelDimension}
          height={dumpsterFirePixelsStatics.dimensions.height as PixelDimension}
        />
      </Group>
      {ornament ? null : (
        <Text
          ff="monospace"
          data-testid="DUMPSTER_RACCOON_LOADING"
          style={{
            fontSize: 11,
            color: emberDepthsThemeStatics.colors['text-dim'],
            marginTop: 8,
          }}
        >
          Loading dumpster dungeon visuals...
        </Text>
      )}
    </Box>
  );
};
