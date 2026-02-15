/**
 * PURPOSE: Renders pixel art sprites using CSS box-shadow technique
 *
 * USAGE:
 * <PixelSpriteWidget pixels={pixels} scale={scale} width={width} height={height} />
 * // Renders a div with box-shadow painting each pixel at the given scale
 */

import type { PixelCoordinate } from '../../contracts/pixel-coordinate/pixel-coordinate-contract';
import type { PixelDimension } from '../../contracts/pixel-dimension/pixel-dimension-contract';

export interface PixelSpriteWidgetProps {
  pixels: readonly PixelCoordinate[];
  scale: PixelDimension;
  width: PixelDimension;
  height: PixelDimension;
  flip?: boolean;
}

export const PixelSpriteWidget = ({
  pixels,
  scale,
  width,
  height,
  flip,
}: PixelSpriteWidgetProps): React.JSX.Element => {
  const shadow = pixels
    .map((p) => {
      const [xStr, yStr, color] = p.split(' ');
      const x = Number(xStr);
      const y = Number(yStr);
      const offsetX = flip ? (width - 1 - x) * scale : x * scale;
      const offsetY = y * scale;
      return `${offsetX}px ${offsetY}px 0 0 ${color}`;
    })
    .join(',');

  return (
    <div
      data-testid="PIXEL_SPRITE"
      style={{
        width: scale,
        height: scale,
        boxShadow: shadow,
        transform: flip ? 'scaleX(-1)' : undefined,
        marginRight: flip ? 0 : `${(width - 1) * scale}px`,
        marginLeft: flip ? `${(width - 1) * scale}px` : 0,
        marginBottom: `${(height - 1) * scale}px`,
      }}
    />
  );
};
