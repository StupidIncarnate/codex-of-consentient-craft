import React from 'react';
import { useTheme } from '../themes.jsx';

// Mirrors packages/web RateLimitCardWidget + rateLimitBar/Color transformers:
// [ 5h ▰▰▱▱▱▱▱▱ 3% (2h5m) ] — bar is 8 wide; >=80 danger, >=50 warning, else text-dim.
export const rateBar = (pct) => {
  const filled = Math.max(0, Math.min(8, Math.floor((pct * 8 + 50) / 100)));
  return '▰'.repeat(filled) + '▱'.repeat(8 - filled);
};

export function RateLimitCard({ label, pct, reset }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const color = pct >= 80 ? c['danger'] : pct >= 50 ? c['warning'] : c['text-dim'];
  return (
    <div
      style={{ fontFamily: 'monospace', fontSize: 12, color: c['text-dim'], whiteSpace: 'nowrap' }}
    >
      [ {label}{' '}
      <span style={{ color }}>
        {rateBar(pct)} {Math.round(pct)}%
      </span>{' '}
      ({reset}) ]
    </div>
  );
}
