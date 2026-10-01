import React from 'react';
import { UnstyledButton } from '@mantine/core';
import { useTheme } from '../themes.jsx';

// Mirrors packages/web PixelBtnWidget: primary / ghost / danger, icon variant, 2px radius.
export function PixelBtn({
  label,
  onClick,
  variant = 'primary',
  icon = false,
  disabled = false,
  title,
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const bg = isPrimary ? c['primary'] : isDanger ? c['danger'] : c['bg-raised'];
  const fg = isPrimary || isDanger ? c['bg-deep'] : c['text'];
  return (
    <UnstyledButton
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      style={{
        fontFamily: 'monospace',
        fontSize: icon ? 15 : 11,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${c['border']}`,
        borderRadius: 2,
        padding: icon ? '0 8px' : '4px 12px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </UnstyledButton>
  );
}
