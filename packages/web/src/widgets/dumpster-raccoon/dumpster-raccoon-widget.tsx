/**
 * PURPOSE: Displays raccoon wizard and dumpster fire sprites side-by-side with idle animations as a loading placeholder
 *
 * USAGE:
 * <DumpsterRaccoonWidget />
 * // Renders raccoon sprite flipping every 2500ms next to a dumpster fire with alternating flame frames
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

const raccoonPixels = raccoonWizardPixelsStatics.pixels.map((p) =>
  pixelCoordinateContract.parse(p),
);

const fireFrameA = dumpsterFirePixelsStatics.frameA.map((p) => pixelCoordinateContract.parse(p));

const fireFrameB = dumpsterFirePixelsStatics.frameB.map((p) => pixelCoordinateContract.parse(p));

export const DumpsterRaccoonWidget = (): React.JSX.Element => {
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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: emberDepthsThemeStatics.colors['bg-surface'],
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
      <Text
        ff="monospace"
        style={{
          fontSize: 11,
          color: emberDepthsThemeStatics.colors['text-dim'],
          marginTop: 8,
        }}
      >
        Loading dumpster dungeon visuals...
      </Text>
    </Box>
  );
};
