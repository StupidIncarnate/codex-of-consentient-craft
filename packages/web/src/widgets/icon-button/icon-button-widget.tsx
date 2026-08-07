/**
 * PURPOSE: The single place this app constructs a Mantine ActionIcon. Every icon-only control —
 * diagram zoom, comment bubble, queue Send, quest delete — goes through here so the square pixel-art
 * treatment, the three theme colours and the size scale are decided once instead of being re-tuned
 * per call site. Reach for this over PixelBtnWidget when the control's whole content is a glyph;
 * PixelBtnWidget carries a text label and sizes itself from that text.
 *
 * USAGE:
 * <IconButtonWidget label={label} icon={IconSend} onClick={handleSend} variant={primary} />
 * // Renders a square 22px button with the orange primary fill and a 14px send glyph
 */

import { ActionIcon } from '@mantine/core';
import type { TablerIcon } from '@tabler/icons-react';

import type { ButtonLabel } from '../../contracts/button-label/button-label-contract';
import type { ButtonVariant } from '../../contracts/button-variant/button-variant-contract';
import { iconButtonSizeContract } from '../../contracts/icon-button-size/icon-button-size-contract';
import type { IconButtonSize } from '../../contracts/icon-button-size/icon-button-size-contract';
import type { TestId } from '../../contracts/test-id/test-id-contract';
import { emberDepthsThemeStatics } from '../../statics/ember-depths-theme/ember-depths-theme-statics';
import { iconButtonStatics } from '../../statics/icon-button/icon-button-statics';

const { colors } = emberDepthsThemeStatics;
const DEFAULT_SIZE = iconButtonSizeContract.parse(iconButtonStatics.sizes.small);
const DISABLED_OPACITY = 0.4;

export interface IconButtonWidgetProps {
  /** Accessible name — an icon-only control has no text to announce itself with. */
  label: ButtonLabel;
  /** The glyph component itself, not an element: this widget sizes it from `size`. */
  icon: TablerIcon;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  testId: TestId;
  /** Omitted means the default brown treatment — the same ghost fill the ABANDON button carries. */
  variant?: ButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  /** Toggle state for a button that opens and closes something, published as `data-expanded`. */
  expanded?: boolean;
  /**
   * Popover.Target clones its child and injects these; without them the dropdown loses the element
   * it anchors to and the aria wiring that ties the two together.
   */
  ref?: React.Ref<HTMLButtonElement>;
  id?: HTMLElement['id'];
  className?: HTMLElement['className'];
  'aria-haspopup'?: React.AriaAttributes['aria-haspopup'];
  'aria-expanded'?: React.AriaAttributes['aria-expanded'];
  'aria-controls'?: React.AriaAttributes['aria-controls'];
}

export const IconButtonWidget = ({
  label,
  icon: Icon,
  onClick,
  testId,
  variant,
  size,
  disabled,
  expanded,
  ref,
  id,
  className,
  'aria-haspopup': ariaHasPopup,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
}: IconButtonWidgetProps): React.JSX.Element => {
  const resolvedSize = size ?? DEFAULT_SIZE;
  // The brand survives assignment but not an index expression, so the key is widened back to the
  // plain enum member here rather than asserted at the lookup.
  const glyphKey: keyof typeof iconButtonStatics.glyphPx = resolvedSize;
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const background = isPrimary ? colors.primary : isDanger ? colors.danger : colors['bg-raised'];
  const foreground = isPrimary || isDanger ? colors['bg-deep'] : colors.text;

  return (
    <ActionIcon
      aria-label={String(label)}
      data-testid={testId}
      // Spread rather than passed: under exactOptionalPropertyTypes an explicit `undefined` is not
      // the same as an absent prop, and every one of these is absent at most call sites.
      {...(ref === undefined ? {} : { ref })}
      {...(id === undefined ? {} : { id })}
      {...(className === undefined ? {} : { className })}
      {...(ariaHasPopup === undefined ? {} : { 'aria-haspopup': ariaHasPopup })}
      {...(ariaExpanded === undefined ? {} : { 'aria-expanded': ariaExpanded })}
      {...(ariaControls === undefined ? {} : { 'aria-controls': ariaControls })}
      {...(disabled === undefined ? {} : { disabled })}
      {...(expanded === undefined ? {} : { 'data-expanded': expanded })}
      onClick={onClick}
      // `filled` keeps Mantine from resolving its own palette on top of the theme colours set
      // below — the variant prop on THIS widget is the app's own brown/orange/red scale, which has
      // no counterpart in Mantine's variant list.
      variant="filled"
      size={resolvedSize}
      style={{
        backgroundColor: background,
        color: foreground,
        border: `1px solid ${colors.border}`,
        // The near-square corner is the root style PixelBtnWidget and the diagram controls share.
        borderRadius: iconButtonStatics.borderRadiusPx,
        cursor: disabled === true ? 'default' : 'pointer',
        opacity: disabled === true ? DISABLED_OPACITY : 1,
      }}
    >
      <Icon size={iconButtonStatics.glyphPx[glyphKey]} />
    </ActionIcon>
  );
};
