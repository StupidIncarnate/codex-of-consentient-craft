/**
 * PURPOSE: Renders a pixel-art styled button with primary or ghost variant
 *
 * USAGE:
 * <PixelBtnWidget label={label} onClick={handleClick} variant={variant} />
 * // Renders a monospace styled UnstyledButton with theme colors
 */

import { UnstyledButton } from '@mantine/core';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';

const ICON_FONT_SIZE = 15;
const NORMAL_FONT_SIZE = 11;
const ICON_PADDING = '0 8px';
const NORMAL_PADDING = '4px 12px';
const BORDER_RADIUS = 2;

export interface PixelBtnWidgetProps {
  label: ButtonLabel;
  onClick: () => void;
  variant?: ButtonVariant;
  icon?: boolean;
}

export const PixelBtnWidget = ({
  label,
  onClick,
  variant,
  icon,
}: PixelBtnWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isPrimary = !variant || variant === 'primary';
  const bg = isPrimary ? colors.primary : colors['bg-raised'];
  const fg = isPrimary ? colors['bg-deep'] : colors.text;

  return (
    <UnstyledButton
      onClick={onClick}
      data-testid="PIXEL_BTN"
      style={{
        fontFamily: 'monospace',
        fontSize: icon ? ICON_FONT_SIZE : NORMAL_FONT_SIZE,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${colors.border}`,
        borderRadius: BORDER_RADIUS,
        padding: icon ? ICON_PADDING : NORMAL_PADDING,
        cursor: 'pointer',
      }}
    >
      {label}
    </UnstyledButton>
  );
};
