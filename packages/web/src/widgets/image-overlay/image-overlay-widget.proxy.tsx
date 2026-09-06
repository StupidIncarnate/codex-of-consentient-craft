import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IconButtonWidgetProxy } from '../icon-button/icon-button-widget.proxy';

export const ImageOverlayWidgetProxy = (): {
  hasOverlay: () => boolean;
  getImageSrc: () => HTMLImageElement['src'] | null;
  getImageAlt: () => HTMLImageElement['alt'] | null;
  getImageWidth: () => HTMLElement['style']['width'];
  getBodyMaxHeight: () => HTMLElement['style']['maxHeight'];
  getBodyOverflowY: () => HTMLElement['style']['overflowY'];
  getModalWidth: () => HTMLElement['style']['width'];
  clickClose: () => Promise<void>;
  hasCloseButton: () => boolean;
  pressEscape: () => Promise<void>;
  clickOutside: () => Promise<void>;
} => {
  IconButtonWidgetProxy();
  const user = userEvent.setup();

  return {
    hasOverlay: (): boolean => screen.queryByTestId('IMAGE_OVERLAY') !== null,
    // getAttribute (not the `.src`/`.alt` IDL properties) so a data URL and an http URL both come
    // back byte-for-byte what was passed — the IDL properties resolve `src` into an absolute URL,
    // which is exactly the normalization the composer/transcript equivalence test must not tolerate.
    getImageSrc: (): HTMLImageElement['src'] | null =>
      screen.getByTestId('IMAGE_OVERLAY_IMAGE').getAttribute('src'),
    getImageAlt: (): HTMLImageElement['alt'] | null =>
      screen.getByTestId('IMAGE_OVERLAY_IMAGE').getAttribute('alt'),
    getImageWidth: (): HTMLElement['style']['width'] =>
      screen.getByTestId('IMAGE_OVERLAY_IMAGE').style.width,
    getBodyMaxHeight: (): HTMLElement['style']['maxHeight'] =>
      screen.getByTestId('IMAGE_OVERLAY').style.maxHeight,
    getBodyOverflowY: (): HTMLElement['style']['overflowY'] =>
      screen.getByTestId('IMAGE_OVERLAY').style.overflowY,
    // Mantine's `size` prop never becomes a `width` style — it lands as the `--modal-size` custom
    // property on the `.mantine-Modal-root` wrapper (the element two levels above the `role="dialog"`
    // content this proxy already reads), which is why every other getter here reads a testid instead.
    // `.mantine-Modal-root` is Mantine's own stable, human-readable class (its documented styling
    // hook), not a hashed one, so it survives a Mantine version bump the way a hashed class would not.
    getModalWidth: (): HTMLElement['style']['width'] => {
      const modalRoot = document.querySelector<HTMLElement>('.mantine-Modal-root');
      if (modalRoot === null) {
        throw new Error(
          'ImageOverlayWidgetProxy.getModalWidth: no .mantine-Modal-root in the document — is the modal opened?',
        );
      }
      return modalRoot.style.getPropertyValue('--modal-size');
    },
    clickClose: async (): Promise<void> => {
      await user.click(screen.getByTestId('IMAGE_OVERLAY_CLOSE'));
    },
    hasCloseButton: (): boolean => screen.queryByTestId('IMAGE_OVERLAY_CLOSE') !== null,
    // Mantine's Escape handler is a window-level `keydown` listener (registered with `capture:
    // true` in its own `useModal` hook), not a listener on any element this widget renders — so
    // there is no element to target. userEvent.keyboard dispatches on `document.activeElement`
    // (falling back to the document body), and the event bubbles/captures to `window` the same as
    // a real keypress would.
    pressEscape: async (): Promise<void> => {
      await user.keyboard('{Escape}');
    },
    // The click-outside close is the overlay/backdrop element's own onClick handler (Mantine's
    // ModalBaseOverlay), not a document-level listener — so this has to click that element
    // specifically, the same way the sibling getter above reads `.mantine-Modal-root`:
    // `.mantine-Overlay-root` is the Overlay component's own stable, human-readable static class
    // (name "Overlay", selector "root"), not a hashed one.
    clickOutside: async (): Promise<void> => {
      const overlay = document.querySelector<HTMLElement>('.mantine-Overlay-root');
      if (overlay === null) {
        throw new Error(
          'ImageOverlayWidgetProxy.clickOutside: no .mantine-Overlay-root in the document — is the modal opened?',
        );
      }
      await user.click(overlay);
    },
  };
};
