import React from 'react';
import { PixelSprite } from './pixel-sprite.jsx';
import { fireballPixels } from '../sprites/fireball.jsx';
import { useTheme } from '../themes.jsx';

// Same ASCII art as packages/web LogoWidget (7px, line-height 1.15, fireballs at scale 4 on both sides).
const logo = `\
██████╗ ██╗   ██╗███╗   ██╗ ██████╗ ███████╗ ██████╗ ███╗   ██╗███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗
██╔══██╗██║   ██║████╗  ██║██╔════╝ ██╔════╝██╔═══██╗████╗  ██║████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║  ██║██║   ██║██╔██╗ ██║██║  ███╗█████╗  ██║   ██║██╔██╗ ██║██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██║  ██║██║   ██║██║╚██╗██║██║   ██║██╔══╝  ██║   ██║██║╚██╗██║██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝███████╗╚██████╔╝██║ ╚████║██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝`;

export function Logo({ scale = 4, fontSize = 7, gap = 40, sprites = true }) {
  const { theme } = useTheme();
  const sprite = (flip) => (
    <div className="logo-sprite">
      <PixelSprite pixels={fireballPixels} scale={scale} width={12} height={12} flip={flip} />
    </div>
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, flexWrap: 'nowrap' }}>
      {sprites && sprite(false)}
      <pre
        style={{
          color: theme.colors['primary'],
          fontFamily: 'monospace',
          fontSize,
          lineHeight: 1.15,
          margin: 0,
          whiteSpace: 'pre',
        }}
      >
        {logo}
      </pre>
      {sprites && sprite(true)}
    </div>
  );
}
