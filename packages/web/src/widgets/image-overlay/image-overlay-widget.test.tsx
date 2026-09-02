import { screen } from '@testing-library/react';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { ImageOverlayWidget } from './image-overlay-widget';
import { ImageOverlayWidgetProxy } from './image-overlay-widget.proxy';

const ALT_TEXT = 'Pasted image';
// A minimal but well-formed 1x1 PNG data URL — the shape the composer caller passes for an image
// the server has never seen.
const DATA_URL_SRC =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
// The shape the transcript caller passes for an image the server serves from disk.
const HTTP_URL_SRC = 'http://localhost:3737/api/images/quest-123/pasted-1.png';

describe('ImageOverlayWidget', () => {
  describe('rendering', () => {
    it('VALID: {opened: true} => renders IMAGE_OVERLAY and IMAGE_OVERLAY_IMAGE with the exact src and alt passed', () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });

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

      await proxy.clickClose();

      // Paired per house rule: call count alone can't tell a click that landed on the wrong control
      // from one that landed here and fired with an unexpected argument — onClose takes none.
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledWith();
    });
  });

  // These two exist because the shared-widget decision (one overlay, two callers) is the thing a
  // later reader will question — each test is named for the caller whose URL shape it stands in for.
  describe('caller URL shapes', () => {
    it('VALID: {src: base64 data URL} => renders unchanged — the composer caller, for an image the server has never seen', () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={DATA_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });

      expect(proxy.getImageSrc()).toBe(DATA_URL_SRC);
    });

    it('VALID: {src: http URL} => renders unchanged — the transcript caller, for an image the server serves from disk', () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });

      expect(proxy.getImageSrc()).toBe(HTTP_URL_SRC);
    });
  });

  describe('sizing', () => {
    // jsdom performs no layout: these assert the STYLE VALUES the widget writes, which proves the
    // sizing rules were written, never that a real browser painted the image at that width or
    // actually scrolled the body — only Playwright could show that.
    it('VALID: {opened: true} => the image is width-constrained and the modal body caps height with scroll', () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });

      expect(proxy.getImageWidth()).toBe('100%');
      expect(proxy.getBodyMaxHeight()).toBe(
        `${String(webConfigStatics.pastedImage.overlayMaxHeightPercent)}vh`,
      );
      expect(proxy.getBodyOverflowY()).toBe('auto');
    });

    it('VALID: {opened: true} => the modal itself is constrained to the configured viewport-width share', () => {
      const proxy = ImageOverlayWidgetProxy();

      mantineRenderAdapter({
        ui: (
          <ImageOverlayWidget opened={true} src={HTTP_URL_SRC} alt={ALT_TEXT} onClose={jest.fn()} />
        ),
      });

      expect(proxy.getModalWidth()).toBe(
        `${String(webConfigStatics.pastedImage.overlayWidthPercent)}%`,
      );
    });
  });
});
