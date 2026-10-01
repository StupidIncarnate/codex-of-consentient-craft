import React from 'react';
import { useTheme } from '../themes.jsx';

// Mirrors packages/web MapFrameWidget: 2px border, unicode corner glyphs.
export function MapFrame({ children, padding = 16, style }) {
  const { theme } = useTheme();
  const dim = theme.colors['text-dim'];
  const corner = {
    color: dim,
    position: 'absolute',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 1.55,
  };
  return (
    <div
      style={{
        border: `2px solid ${theme.colors['border']}`,
        borderRadius: 2,
        padding,
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      <span style={{ ...corner, top: -1, left: 8 }}>{'┌──'}</span>
      <span style={{ ...corner, top: -1, right: 8 }}>{'──┐'}</span>
      <span style={{ ...corner, bottom: -1, left: 8 }}>{'└──'}</span>
      <span style={{ ...corner, bottom: -1, right: 8 }}>{'──┘'}</span>
      {children}
    </div>
  );
}
