/**
 * PURPOSE: Renders a pixel-art styled button with primary, ghost, or danger variant
 *
 * USAGE:
 * <PixelBtnWidget label={label} onClick={handleClick} variant={variant} disabled={disabled} />
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
const DISABLED_OPACITY = 0.4;

export interface PixelBtnWidgetProps {
  label: ButtonLabel;
  onClick: () => void;
  variant?: ButtonVariant;
  icon?: boolean;
  disabled?: boolean;
}

export const PixelBtnWidget = ({
  label,
  onClick,
  variant,
  icon,
  disabled,
}: PixelBtnWidgetProps): React.JSX.Element => {
  const { colors } = emberDepthsThemeStatics;
  const isPrimary = !variant || variant === 'primary';
  const isDanger = variant === 'danger';
  const bg = isPrimary ? colors.primary : isDanger ? colors.danger : colors['bg-raised'];
  const fg = isPrimary || isDanger ? colors['bg-deep'] : colors.text;

  return (
    <UnstyledButton
      onClick={disabled ? undefined : onClick}
      // The native attribute as well as the dimmed styling. `pointerEvents: none` stops a mouse
      // and nothing else: a keyboard press, a screen reader and Playwright's own disabled check all
      // read the attribute, so styling alone leaves the control looking off and behaving live.
      disabled={disabled === true}
      data-testid="PIXEL_BTN"
      style={{
        fontFamily: 'monospace',
        fontSize: icon ? ICON_FONT_SIZE : NORMAL_FONT_SIZE,
        color: fg,
        backgroundColor: bg,
        border: `1px solid ${colors.border}`,
        borderRadius: BORDER_RADIUS,
        padding: icon ? ICON_PADDING : NORMAL_PADDING,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? DISABLED_OPACITY : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {label}
    </UnstyledButton>
  );
};
