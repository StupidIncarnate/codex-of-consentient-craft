import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const IconButtonWidgetProxy = (): {
  click: () => Promise<void>;
  accessibleName: () => HTMLElement['ariaLabel'];
  glyph: () => HTMLElement['className'];
  glyphSize: () => HTMLElement['className'];
  size: () => HTMLElement['style']['width'];
  background: () => HTMLElement['style']['backgroundColor'];
  foreground: () => HTMLElement['style']['color'];
  borderRadius: () => HTMLElement['style']['borderRadius'];
  isDisabled: () => boolean;
  tagName: () => HTMLElement['tagName'];
} => {
  const user = userEvent.setup();
  const button = (): HTMLElement => screen.getByTestId('ICON_BUTTON');

  return {
    click: async (): Promise<void> => {
      await user.click(button());
    },
    accessibleName: (): HTMLElement['ariaLabel'] => button().getAttribute('aria-label'),
    // The tabler mock stamps each icon's component name as its testid, so this is which glyph the
    // button chose to paint — the one thing a caller hands over that has no style of its own.
    glyph: (): HTMLElement['className'] =>
      button().querySelector('[data-testid^="Icon"]')?.getAttribute('data-testid') ?? '',
    glyphSize: (): HTMLElement['className'] =>
      button().querySelector('[data-testid^="Icon"]')?.getAttribute('size') ?? '',
    size: (): HTMLElement['style']['width'] => button().style.getPropertyValue('--ai-size'),
    background: (): HTMLElement['style']['backgroundColor'] => button().style.backgroundColor,
    foreground: (): HTMLElement['style']['color'] => button().style.color,
    borderRadius: (): HTMLElement['style']['borderRadius'] => button().style.borderRadius,
    isDisabled: (): boolean => button().hasAttribute('disabled'),
    tagName: (): HTMLElement['tagName'] => button().tagName,
  };
};
