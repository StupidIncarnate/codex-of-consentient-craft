import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { UserChatEntryStub } from '@dungeonmaster/shared/contracts';

import type { ImageDataUrlStub } from '../../contracts/image-data-url/image-data-url.stub';
import { pastedImageMemoryState } from '../../state/pasted-image-memory/pasted-image-memory-state';
import { pastedImageMemoryStateProxy } from '../../state/pasted-image-memory/pasted-image-memory-state.proxy';
import { ImageOverlayWidgetProxy } from '../image-overlay/image-overlay-widget.proxy';

type ChatEntryUuid = ReturnType<typeof UserChatEntryStub>['uuid'];
type ImageDataUrl = ReturnType<typeof ImageDataUrlStub>;

export const ImageContentLayerWidgetProxy = (): {
  rememberImages: (params: { uuid: ChatEntryUuid; dataUrls: readonly ImageDataUrl[] }) => void;
  getImageSrcs: () => readonly HTMLImageElement['src'][];
  getBubbleText: () => NonNullable<HTMLElement['textContent']>;
  getChildTestIds: () => readonly ReturnType<Element['getAttribute']>[];
  clickImage: (params: { index: number }) => Promise<void>;
  failImage: (params: { index: number }) => void;
  hasOverlay: () => boolean;
  getOverlaySrc: () => HTMLImageElement['src'] | null;
  closeOverlayByEscape: () => Promise<void>;
  closeOverlayByClickOutside: () => Promise<void>;
  closeOverlayByButton: () => Promise<void>;
  getBrokenPlaceholderSize: () => {
    width: HTMLElement['style']['width'];
    height: HTMLElement['style']['height'];
  };
  getBrokenPlaceholderPaint: () => {
    borderColor: HTMLElement['style']['borderColor'];
    backgroundColor: HTMLElement['style']['backgroundColor'];
  };
  getImageBoxDimensions: (params: { index: number }) => {
    width: HTMLElement['style']['width'];
    height: HTMLElement['style']['height'];
  };
} => {
  const memoryProxy = pastedImageMemoryStateProxy();
  const overlayProxy = ImageOverlayWidgetProxy();
  const user = userEvent.setup();

  return {
    // Clears any bytes a previous test left staged, then stages this call's own — the real
    // `remember` call itself has no I/O boundary to mock (same module pasted-image-memory-state.test.ts
    // exercises directly), so only the reset half needs the child proxy.
    rememberImages: ({ uuid, dataUrls }): void => {
      memoryProxy.setupEmpty();
      pastedImageMemoryState.remember({ uuid, dataUrls });
    },
    // getAttribute (not the `.src` IDL property) so a data URL comes back byte-for-byte what the
    // widget wrote — same reasoning as ImageOverlayWidgetProxy's getImageSrc.
    getImageSrcs: (): readonly HTMLImageElement['src'][] =>
      screen.queryAllByTestId('CHAT_MESSAGE_IMAGE').map((image) => image.getAttribute('src') ?? ''),
    // The container's own textContent already excludes every img and broken-placeholder span —
    // neither carries a text node — so stripping images out of the bubble is free.
    getBubbleText: (): NonNullable<HTMLElement['textContent']> =>
      screen.getByTestId('IMAGE_CONTENT_LAYER').textContent ?? '',
    getChildTestIds: (): readonly ReturnType<Element['getAttribute']>[] =>
      Array.from(screen.getByTestId('IMAGE_CONTENT_LAYER').children).map((child) =>
        child.getAttribute('data-testid'),
      ),
    clickImage: async ({ index }): Promise<void> => {
      const image = screen.getAllByTestId('CHAT_MESSAGE_IMAGE')[index];
      if (image === undefined) {
        throw new Error(`no CHAT_MESSAGE_IMAGE was rendered at index ${String(index)}`);
      }
      await user.click(image);
    },
    // A real `error` event, not userEvent (which has no equivalent) — this does not bubble the way
    // a click does, so it is fired directly on the image element.
    failImage: ({ index }): void => {
      const image = screen.getAllByTestId('CHAT_MESSAGE_IMAGE')[index];
      if (image === undefined) {
        throw new Error(`no CHAT_MESSAGE_IMAGE was rendered at index ${String(index)}`);
      }
      fireEvent.error(image);
    },
    hasOverlay: (): boolean => overlayProxy.hasOverlay(),
    getOverlaySrc: (): HTMLImageElement['src'] | null => overlayProxy.getImageSrc(),
    closeOverlayByEscape: async (): Promise<void> => overlayProxy.pressEscape(),
    closeOverlayByClickOutside: async (): Promise<void> => overlayProxy.clickOutside(),
    closeOverlayByButton: async (): Promise<void> => overlayProxy.clickClose(),
    getBrokenPlaceholderSize: (): {
      width: HTMLElement['style']['width'];
      height: HTMLElement['style']['height'];
    } => {
      const placeholder = screen.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN');
      return { width: placeholder.style.width, height: placeholder.style.height };
    },
    getBrokenPlaceholderPaint: (): {
      borderColor: HTMLElement['style']['borderColor'];
      backgroundColor: HTMLElement['style']['backgroundColor'];
    } => {
      const placeholder = screen.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN');
      return {
        borderColor: placeholder.style.borderColor,
        backgroundColor: placeholder.style.backgroundColor,
      };
    },
    getImageBoxDimensions: ({
      index,
    }): { width: HTMLElement['style']['width']; height: HTMLElement['style']['height'] } => {
      const image = screen.getAllByTestId('CHAT_MESSAGE_IMAGE')[index];
      if (image === undefined) {
        throw new Error(`no CHAT_MESSAGE_IMAGE was rendered at index ${String(index)}`);
      }
      return { width: image.style.width, height: image.style.height };
    },
  };
};
