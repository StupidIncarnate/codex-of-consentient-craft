import { screen, waitFor } from '@testing-library/react';

import { UserChatEntryStub } from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { ImageDataUrlStub } from '../../contracts/image-data-url/image-data-url.stub';
import { webConfigStatics } from '../../statics/web-config/web-config-statics';
import { ImageContentLayerWidget } from './image-content-layer-widget';
import { ImageContentLayerWidgetProxy } from './image-content-layer-widget.proxy';

// UserChatEntryStub's declared return type is the full ChatEntry union (every variant, only some
// of which carry `content`), even though it always constructs a role: 'user' object at runtime —
// narrowing with a real type predicate (never an `as` cast) is what lets `.content` typecheck below.
// Mirrors the idiom already established in chat-replay-responder.test.ts's ChatOutputUserEntry.
type UserEntry = Extract<ReturnType<typeof UserChatEntryStub>, { role: 'user' }>;

// A realistic served URL — the shape the server hands back for an image already on disk.
const SRC_A = 'http://host/api/images?path=%2Fp%2Fx.png';
const SRC_B = 'http://host/api/images?path=%2Fp%2Fy.png';

describe('ImageContentLayerWidget', () => {
  describe('markdown image tokens', () => {
    it('VALID: {content: one markdown image token} => renders CHAT_MESSAGE_IMAGE with the src from the token parentheses', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      // #one-image-element-per-image: the COMPLETE list of rendered srcs is this one element —
      // a widget that duplicated the image into two DOM nodes would fail this exact assertion.
      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A]);
    });

    it('VALID: {content: text A, token, text B} => child order is text, img, text; the img carries the token src and the trailing text stays an inline span', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `A![Pasted Image 1](${SRC_A})B` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      // #render-inline
      expect(proxy.getChildTestIds()).toStrictEqual([
        'CHAT_MESSAGE_TEXT',
        'CHAT_MESSAGE_IMAGE',
        'CHAT_MESSAGE_TEXT',
      ]);
      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A]);
      // #text-after-image-continues-on-the-line: the trailing text is a SPAN (inline), not a DIV
      // that would start a new line after the image.
      expect(proxy.getChildTagNames()).toStrictEqual(['SPAN', 'IMG', 'SPAN']);
    });

    it('VALID: {content: a delivered markdown token whose served path is percent-encoded} => the rendered src carries the query string byte-for-byte, undecoded', () => {
      // #delivered-token-carries-served-url
      const proxy = ImageContentLayerWidgetProxy();
      const servedUrl = 'http://host/api/images?path=%2Fhome%2Fu%2Fq%2Fimages%2Fa.png';
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${servedUrl})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      expect(proxy.getImageSrcs()).toStrictEqual([servedUrl]);
    });

    it('VALID: {content: two tokens, one message} => both images render between their sentence halves, in composed order', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({
          content: `this image ![Pasted Image 1](${SRC_A}) versus this image ![Pasted Image 2](${SRC_B}).`,
        }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      expect(proxy.getChildTestIds()).toStrictEqual([
        'CHAT_MESSAGE_TEXT',
        'CHAT_MESSAGE_IMAGE',
        'CHAT_MESSAGE_TEXT',
        'CHAT_MESSAGE_IMAGE',
        'CHAT_MESSAGE_TEXT',
      ]);
      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A, SRC_B]);
    });

    it('VALID: {content: text around a token} => stripping the image leaves exactly the typed text, no leftover token characters', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const textA = 'Check out this diagram: ';
      const textB = ' — pretty cool huh?';
      const { content, uuid } = [
        UserChatEntryStub({ content: `${textA}![Pasted Image 1](${SRC_A})${textB}` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      expect(proxy.getBubbleText()).toBe(`${textA}${textB}`);
    });
  });

  describe('inline image sizing', () => {
    it('VALID: {content: one markdown image token} => the rendered img carries the configured inlineImageMaxHeightPx as its style maxHeight', () => {
      ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      const image = screen.getByTestId('CHAT_MESSAGE_IMAGE');

      expect(image.style.maxHeight).toBe(
        `${webConfigStatics.pastedImage.inlineImageMaxHeightPx}px`,
      );
    });

    it('VALID: {content: text followed by a markdown image token} => the img declares inline-block display and middle vertical-align, so it shares the text line rather than forcing a break or sinking below the baseline', () => {
      // #image-sits-on-the-same-line
      ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `Here is the diagram: ![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      const image = screen.getByTestId('CHAT_MESSAGE_IMAGE');

      expect({
        display: image.style.display,
        verticalAlign: image.style.verticalAlign,
      }).toStrictEqual({ display: 'inline-block', verticalAlign: 'middle' });
    });
  });

  describe('trailer', () => {
    it('VALID: {content: message + sentinel trailer} => the trailer never renders in the bubble', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const message = 'Please review this change';
      const { content, uuid } = [
        UserChatEntryStub({
          content: `${message}${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`,
        }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      expect(proxy.getBubbleText()).toBe(message);
    });
  });

  describe('optimistic messages (in-memory bytes)', () => {
    it('VALID: {content: bare placeholder, matching uuid staged in memory} => renders the staged data URL immediately', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const dataUrl = ImageDataUrlStub();
      const { content, uuid } = [
        UserChatEntryStub({ content: 'Look at this [Pasted Image 1]' }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;
      proxy.rememberImages({ uuid, dataUrls: [dataUrl] });

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      // A `data:` src carries its own bytes inline in the attribute value, so there is nothing for
      // the browser to fetch — the "no GET issued" half of this scenario rests entirely on the src
      // being this exact data URL rather than an http one. #staged-copy-needs-no-network
      // This assertion runs against the FIRST render — no waitFor, no rerender above — so it is
      // also what proves #image-shows-without-a-reload: the image is already there with nothing
      // else having to happen first.
      expect(proxy.getImageSrcs()).toStrictEqual([dataUrl]);
    });

    describe('bytes not staged in memory', () => {
      it('VALID: {content: bare placeholder, nothing staged in memory} => the broken-image box takes the place the missing image would have occupied', () => {
        // #missing-image-never-vanishes
        const proxy = ImageContentLayerWidgetProxy();
        const { content, uuid } = [
          UserChatEntryStub({ content: 'before [Pasted Image 1] after' }),
        ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

        mantineRenderAdapter({
          ui: <ImageContentLayerWidget content={content} entryUuid={uuid} />,
        });

        expect(proxy.getChildTestIds()).toStrictEqual([
          'CHAT_MESSAGE_TEXT',
          'CHAT_MESSAGE_IMAGE_BROKEN',
          'CHAT_MESSAGE_TEXT',
        ]);
      });

      it('VALID: {content: bare placeholder, nothing staged in memory} => the text before and after is unchanged and the box names itself for the missing image', () => {
        // #broken-box-keeps-its-place
        const proxy = ImageContentLayerWidgetProxy();
        const { content, uuid } = [
          UserChatEntryStub({ content: 'before [Pasted Image 1] after' }),
        ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

        mantineRenderAdapter({
          ui: <ImageContentLayerWidget content={content} entryUuid={uuid} />,
        });

        expect(proxy.getBubbleText()).toBe('before  after');
        expect(screen.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN').getAttribute('aria-label')).toBe(
          'Pasted image 1 could not be loaded',
        );
      });

      it('VALID: {content: bare placeholder, nothing staged in memory} => the broken box measures the configured broken-thumbnail size, both dimensions', () => {
        // #render-broken-box
        const proxy = ImageContentLayerWidgetProxy();
        const { content, uuid } = [
          UserChatEntryStub({ content: 'before [Pasted Image 1] after' }),
        ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

        mantineRenderAdapter({
          ui: <ImageContentLayerWidget content={content} entryUuid={uuid} />,
        });

        expect(proxy.getBrokenPlaceholderSize()).toStrictEqual({
          width: `${webConfigStatics.pastedImage.brokenThumbnailSizePx}px`,
          height: `${webConfigStatics.pastedImage.brokenThumbnailSizePx}px`,
        });
      });
    });
  });

  describe('click to enlarge', () => {
    it('VALID: {click an image} => opens the overlay showing that exact image, closed beforehand', async () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      expect(proxy.hasOverlay()).toBe(false);

      await proxy.clickImage({ index: 0 });

      // Mantine's Modal mounts its portal content one tick after `opened` flips true (its own open
      // transition), unlike image-overlay-widget.test.tsx's cases, which all start mounted with
      // opened={true} and so never observe that delay. Same fix as
      // chat-input-widget.test.tsx's "#check-composer-click-opens-overlay" case.
      await waitFor(() => {
        expect(proxy.hasOverlay()).toBe(true);
      });

      expect(proxy.getOverlaySrc()).toBe(SRC_A);
    });
  });

  describe('close overlay', () => {
    it('VALID: {overlay open, press Escape} => removes the overlay and leaves the transcript visible', async () => {
      const proxy = ImageContentLayerWidgetProxy();
      const textA = 'Check out this diagram: ';
      const textB = ' — pretty cool huh?';
      const { content, uuid } = [
        UserChatEntryStub({ content: `${textA}![Pasted Image 1](${SRC_A})${textB}` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      await proxy.clickImage({ index: 0 });

      await waitFor(() => {
        expect(proxy.hasOverlay()).toBe(true);
      });

      await proxy.closeOverlayByEscape();

      await waitFor(() => {
        expect(screen.queryByTestId('IMAGE_OVERLAY')).toBe(null);
      });

      expect(proxy.getBubbleText()).toBe(`${textA}${textB}`);
      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A]);
    });

    it('VALID: {overlay open, click outside the image} => removes the overlay and leaves the transcript visible', async () => {
      const proxy = ImageContentLayerWidgetProxy();
      const textA = 'Check out this diagram: ';
      const textB = ' — pretty cool huh?';
      const { content, uuid } = [
        UserChatEntryStub({ content: `${textA}![Pasted Image 1](${SRC_A})${textB}` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      await proxy.clickImage({ index: 0 });

      await waitFor(() => {
        expect(proxy.hasOverlay()).toBe(true);
      });

      await proxy.closeOverlayByClickOutside();

      await waitFor(() => {
        expect(screen.queryByTestId('IMAGE_OVERLAY')).toBe(null);
      });

      expect(proxy.getBubbleText()).toBe(`${textA}${textB}`);
      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A]);
    });

    it('VALID: {overlay open, click the close control} => removes the overlay and leaves the transcript visible', async () => {
      const proxy = ImageContentLayerWidgetProxy();
      const textA = 'Check out this diagram: ';
      const textB = ' — pretty cool huh?';
      const { content, uuid } = [
        UserChatEntryStub({ content: `${textA}![Pasted Image 1](${SRC_A})${textB}` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      await proxy.clickImage({ index: 0 });

      await waitFor(() => {
        expect(proxy.hasOverlay()).toBe(true);
      });

      await proxy.closeOverlayByButton();

      await waitFor(() => {
        expect(screen.queryByTestId('IMAGE_OVERLAY')).toBe(null);
      });

      expect(proxy.getBubbleText()).toBe(`${textA}${textB}`);
      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A]);
    });
  });

  describe('broken images', () => {
    it('VALID: {an image fails to load} => the broken placeholder sits in the image former position, text on both sides intact', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `before ![Pasted Image 1](${SRC_A}) after` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      proxy.failImage({ index: 0 });

      expect(proxy.getChildTestIds()).toStrictEqual([
        'CHAT_MESSAGE_TEXT',
        'CHAT_MESSAGE_IMAGE_BROKEN',
        'CHAT_MESSAGE_TEXT',
      ]);
    });

    it('VALID: {an image fails to load} => the placeholder is exactly the configured broken-thumbnail size, both dimensions', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      proxy.failImage({ index: 0 });

      expect(proxy.getBrokenPlaceholderSize()).toStrictEqual({
        width: `${webConfigStatics.pastedImage.brokenThumbnailSizePx}px`,
        height: `${webConfigStatics.pastedImage.brokenThumbnailSizePx}px`,
      });
    });

    it('VALID: {an image fails to load} => the placeholder paints a legible danger border over a fill distinct from the bubble', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      proxy.failImage({ index: 0 });

      // emberDepthsThemeStatics.colors.danger = '#ef4444' → rgb(239, 68, 68) in JSDOM
      // emberDepthsThemeStatics.colors['bg-deep'] = '#0d0907' → rgb(13, 9, 7) in JSDOM
      // A bare border presence check would pass on a border painted in the same colour as the
      // fill it sits on — the exact colour is the whole point: 4.4:1 against the bubble's
      // `bg-raised`, versus the `border` token's 1.23:1 (packages/web/CLAUDE.md's markdown-rule
      // measurement of that same pair).
      expect(proxy.getBrokenPlaceholderPaint()).toStrictEqual({
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgb(13, 9, 7)',
      });
    });

    it('VALID: {an image fails to load} => the placeholder names itself for assistive tech via role, aria-label, and title', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      proxy.failImage({ index: 0 });

      const placeholder = screen.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN');

      expect({
        role: placeholder.getAttribute('role'),
        ariaLabel: placeholder.getAttribute('aria-label'),
        title: placeholder.getAttribute('title'),
      }).toStrictEqual({
        role: 'img',
        ariaLabel: 'Pasted image 1 could not be loaded',
        title: 'Pasted image 1 could not be loaded',
      });
    });

    it('VALID: {two images, only the first fails} => the second still renders at its original src with no size override', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({
          content: `![Pasted Image 1](${SRC_A}) and ![Pasted Image 2](${SRC_B})`,
        }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      proxy.failImage({ index: 0 });

      expect(proxy.getImageSrcs()).toStrictEqual([SRC_B]);
      expect(proxy.getImageBoxDimensions({ index: 0 })).toStrictEqual({ width: '', height: '' });
    });
  });

  describe('image element identity', () => {
    it('VALID: {content: one markdown image token, rerendered with identical props} => exactly one element carries the src, and the rerender keeps the same DOM node mounted', () => {
      // #image-requested-once: React re-using the node (rather than remounting a second one) is
      // what keeps the browser from ever issuing a second request for it. jsdom loads no image, so
      // "paints the returned bytes" is out of reach here — see NOT PROVED in the final report.
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [
        UserChatEntryStub({ content: `![Pasted Image 1](${SRC_A})` }),
      ].find((candidate): candidate is UserEntry => candidate.role === 'user')!;

      const { rerender } = mantineRenderAdapter({
        ui: <ImageContentLayerWidget content={content} entryUuid={uuid} />,
      });

      expect(proxy.getImageSrcs()).toStrictEqual([SRC_A]);

      const firstImageElement = proxy.getImageElement({ index: 0 });

      rerender(<ImageContentLayerWidget content={content} entryUuid={uuid} />);

      expect(proxy.getImageElement({ index: 0 })).toBe(firstImageElement);
    });
  });

  describe('no images', () => {
    it('VALID: {content: plain text} => renders exactly one text span and no images', () => {
      const proxy = ImageContentLayerWidgetProxy();
      const { content, uuid } = [UserChatEntryStub({ content: 'just a plain message' })].find(
        (candidate): candidate is UserEntry => candidate.role === 'user',
      )!;

      mantineRenderAdapter({ ui: <ImageContentLayerWidget content={content} entryUuid={uuid} /> });

      expect(proxy.getChildTestIds()).toStrictEqual(['CHAT_MESSAGE_TEXT']);
      expect(screen.queryByTestId('CHAT_MESSAGE_IMAGE')).toBe(null);
    });
  });
});
