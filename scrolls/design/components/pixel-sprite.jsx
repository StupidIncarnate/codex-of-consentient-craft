import React from 'react';

export function PixelSprite({ pixels, scale = 4, width = 8, height = 20, flip = false }) {
  const shadow = pixels
    .map((p) => {
      const [x, y, color] = p.split(' ');
      return `${x * scale}px ${y * scale}px 0 0 ${color}`;
    })
    .join(',');

  return (
    <div
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
}
