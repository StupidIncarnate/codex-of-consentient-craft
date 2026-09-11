import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { ImageOverlayWidget } from './image-overlay-widget';
import { ImageOverlayWidgetProxy } from './image-overlay-widget.proxy';

// Mantine's Modal defaults `trapFocus: true`, and @mantine/hooks' `useFocusTrap` arms an
// uncleared, zero-delay `setTimeout` on every mount where it is active (both its ref callback and
// its mount effect — neither stores nor clears the handle). It is not tied to unmount, so it stays
// "armed" for exactly one real event-loop tick regardless of what the test does; a synchronous test
// ending before that tick reports it as leaked. Awaiting one real macrotask lets it fire first.
const flushMountTimers = async (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const ALT_TEXT = 'Pasted image';
// A minimal but well-formed 1x1 PNG data URL — the shape the composer caller passes for an image
// the server has never seen.
const DATA_URL_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
// The shape the transcript caller passes for an image the server serves from disk.
const HTTP_URL_SRC = 'http://localhost:3737/api/images/quest-123/pasted-1.png';

describe('ImageOverlayWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders IMAGE_OVERLAY and IMAGE_OVERLAY_IMAGE with the exact src and alt passed', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });
      await flushMountTimers();

      expect(proxy.hasOverlay()).toBe(true);
      expect(proxy.getImageSrc()).toBe(HTTP_URL_SRC);
      expect(proxy.getImageAlt()).toBe(ALT_TEXT);
    });

    it('VALID: {opened: false} => renders nothing', () => {
      ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget
            opened={false}
            src={HTTP_URL_SRC}
            alt={ALT_TEXT}
            onClose={jest.fn()}
          />
        ),
      });

      expect(screen.queryByTestId('IMAGE_OVERLAY')).toBe(null);
    });

    // Defence-in-depth: neither caller is expected to ever pass an empty src (ChatInputWidget's
    // overlaySrc state and the transcript's own src are both non-empty whenever opened is true), but
    // an `<img>` must never render `src=""` regardless — that value is a real (failing) request to
    // the DOM, not "no image", and paints a broken-image glyph plus a React console warning.
    it('EMPTY: {opened: true, src: ""} => IMAGE_OVERLAY mounts but IMAGE_OVERLAY_IMAGE does not render', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: <ImageOverlayWidget opened={true} src="" alt={ALT_TEXT} onClose={jest.fn()} />,
      });
      await flushMountTimers();

      expect(proxy.hasOverlay()).toBe(true);
      expect(screen.queryByTestId('IMAGE_OVERLAY_IMAGE')).toBe(null);
    });

    it('VALID: {opened: true} => a close control is visible on the modal', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });
      await flushMountTimers();

      expect(proxy.hasCloseButton()).toBe(true);
    });

    // Paired with the case above per house rule: a one-sided presence check alone passes on a
    // widget that renders the close button unconditionally.
    it('VALID: {opened: false} => no close control renders', () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget
            opened={false}
            src={HTTP_URL_SRC}
            alt={ALT_TEXT}
            onClose={jest.fn()}
          />
        ),
      });

      expect(proxy.hasCloseButton()).toBe(false);
    });
  });

  describe('interactions', () => {
    it('VALID: {click close button} => calls onClose exactly once', async () => {
      const proxy = ImageOverlayWidgetProxy();
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={onClose} />
        ),
      });
      await flushMountTimers();

      await proxy.clickClose();

      // Paired per house rule: call count alone can't tell a click that landed on the wrong control
      // from one that landed here and fired with an unexpected argument — onClose takes none.
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith();
    });

    // This widget's only obligation on Escape is firing onClose — whether the transcript behind
    // the overlay stays visible afterwards is the caller's rendering decision, not this widget's.
    it('VALID: {press Escape} => calls onClose exactly once', async () => {
      const proxy = ImageOverlayWidgetProxy();
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={onClose} />
        ),
      });
      await flushMountTimers();

      await proxy.pressEscape();

      // Paired per house rule, same as the close-button case above.
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith();
    });

    it('VALID: {click outside the image} => calls onClose exactly once', async () => {
      const proxy = ImageOverlayWidgetProxy();
      const onClose = jest.fn();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={onClose} />
        ),
      });
      await flushMountTimers();

      await proxy.clickOutside();

      // Paired per house rule, same as the close-button case above.
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith();
    });
  });

  // These two exist because the shared-widget decision (one overlay, two callers) is the thing a
  // later reader will question — each test is named for the caller whose URL shape it stands in for.
  describe('caller URL shapes', () => {
    it('VALID: {src: base64 data URL} => renders unchanged — the composer caller, for an image the server has never seen', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={DATA_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });
      await flushMountTimers();

      expect(proxy.getImageSrc()).toBe(DATA_URL_SRC);
    });

    it('VALID: {src: http URL} => renders unchanged — the transcript caller, for an image the server serves from disk', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });
      await flushMountTimers();

      expect(proxy.getImageSrc()).toBe(HTTP_URL_SRC);
    });
  });

  describe('sizing', () => {
    // jsdom performs no layout: these assert the STYLE VALUES the widget writes, which proves the
    // sizing rules were written, never that a real browser painted the image at that width or
    // actually scrolled the body — only Playwright could show that.
    it('VALID: {opened: true} => the image is width-constrained and the modal body caps height with scroll', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });
      await flushMountTimers();

      expect(proxy.getImageWidth()).toBe('100%');
      expect(proxy.getBodyMaxHeight()).toBe(
        `${String(webConfigStatics.pastedImage.overlayMaxHeightPercent)}vh`,
      );
      expect(proxy.getBodyOverflowY()).toBe('auto');
    });

    it('VALID: {opened: true} => the modal itself is constrained to the configured viewport-width share', async () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });
      await flushMountTimers();

      expect(proxy.getModalWidth()).toBe(
        `${String(webConfigStatics.pastedImage.overlayWidthPercent)}%`,
      );
    });
  });
});
