/**
 * PURPOSE: Reads the geometry ImageContentLayerWidget actually painted for a message composed as
 * text-image-text, so a spec can prove the image renders ON the surrounding text's line rather than
 * being pushed onto a line of its own. `readSegmentDisplays` is the raw per-child read;
 * `readImageAfterTextGeometry` and `readTextAfterImageGeometry` do the FULL browser-side read AND
 * the arithmetic in one round trip, because a `.e2e.ts` spec may declare no function
 * (`forbid-non-exported-functions`) and `jest/no-conditional-in-test` bans `&&` in a test body — so
 * the two booleans a caller needs can only be produced here, never at the call site.
 *
 * USAGE:
 * const inlineLayout = transcriptInlineLayoutHarness();
 * const geometry = await inlineLayout.readImageAfterTextGeometry({ page });
 * // { imageStartsRightOfTextEnd: true, verticalRangesOverlap: true } once the image and the text
 * // before it share a line
 */
import type { Page } from '@playwright/test';

// Every browser-evaluated function below is passed BY REFERENCE to page.evaluate, which serializes
// only the function's own source text — no outer closure survives the trip, so each one queries and
// computes everything it needs on its own. Mirrors the *_BROWSER_FN functions in
// transcript-images.harness.ts. None declare an explicit return type: the result flows straight into
// a harness method below that is itself typed `unknown` — see the file header.

// getComputedStyle, not the raw style attribute — this is what actually resolves the widget's
// `display: 'inline-block'` inline style into what the browser painted, the same distinction
// transcript-images.harness.ts's own READ_OVERLAY_COMPUTED_MAX_HEIGHT_BROWSER_FN draws for `vh`.
const READ_SEGMENT_DISPLAYS_BROWSER_FN = () => {
  const layer = document.querySelector('[data-testid="IMAGE_CONTENT_LAYER"]');
  if (layer === null) {
    throw new Error('transcript-inline-layout harness: IMAGE_CONTENT_LAYER not found');
  }
  return Array.from(layer.children).map((child) => ({
    testId: child.getAttribute('data-testid') ?? '',
    display: getComputedStyle(child).display,
  }));
};

// A message built as text-image-text (images.buildTokenLine's own segment order) renders as exactly
// three IMAGE_CONTENT_LAYER children in that order, so the text BEFORE the image is always index 0 —
// finding the image by its own testId (rather than assuming index 1) is what keeps this correct even
// if a future segment shape inserts something between them.
const READ_IMAGE_AFTER_TEXT_GEOMETRY_BROWSER_FN = () => {
  const layer = document.querySelector('[data-testid="IMAGE_CONTENT_LAYER"]');
  if (layer === null) {
    throw new Error('transcript-inline-layout harness: IMAGE_CONTENT_LAYER not found');
  }
  const children = Array.from(layer.children);
  const [textElement] = children;
  const imageElement = children.find(
    (child) => child.getAttribute('data-testid') === 'CHAT_MESSAGE_IMAGE',
  );
  if (textElement === undefined || imageElement === undefined) {
    throw new Error(
      'transcript-inline-layout harness: text-before-image or image segment not found',
    );
  }
  const textBox = textElement.getBoundingClientRect();
  const imageBox = imageElement.getBoundingClientRect();
  return {
    imageStartsRightOfTextEnd: imageBox.x >= textBox.x + textBox.width - 1,
    verticalRangesOverlap:
      imageBox.y < textBox.y + textBox.height && textBox.y < imageBox.y + imageBox.height,
  };
};

// Mirrors READ_IMAGE_AFTER_TEXT_GEOMETRY_BROWSER_FN for the sibling claim: the text AFTER the image
// is always index 2 in a text-image-text message, found by testId for the same reason.
const READ_TEXT_AFTER_IMAGE_GEOMETRY_BROWSER_FN = () => {
  const layer = document.querySelector('[data-testid="IMAGE_CONTENT_LAYER"]');
  if (layer === null) {
    throw new Error('transcript-inline-layout harness: IMAGE_CONTENT_LAYER not found');
  }
  const children = Array.from(layer.children);
  const imageElement = children.find(
    (child) => child.getAttribute('data-testid') === 'CHAT_MESSAGE_IMAGE',
  );
  const [, , afterElement] = children;
  if (imageElement === undefined || afterElement === undefined) {
    throw new Error(
      'transcript-inline-layout harness: image or text-after-image segment not found',
    );
  }
  const imageBox = imageElement.getBoundingClientRect();
  const afterBox = afterElement.getBoundingClientRect();
  return {
    textStartsRightOfImageEnd: afterBox.x >= imageBox.x + imageBox.width - 1,
    verticalRangesOverlap:
      afterBox.y < imageBox.y + imageBox.height && imageBox.y < afterBox.y + afterBox.height,
  };
};

export const transcriptInlineLayoutHarness = (): {
  readSegmentDisplays: (params: { page: Page }) => Promise<readonly unknown[]>;
  // The whole read AND the two booleans image-renders-inline:observable:image-sits-on-the-same-line
  // needs, computed in the one browser round trip — see the file header for why neither half can
  // live at the spec's call site.
  readImageAfterTextGeometry: (params: { page: Page }) => Promise<unknown>;
  // The whole read AND the two booleans
  // image-renders-inline:observable:text-after-image-continues-on-the-line needs.
  readTextAfterImageGeometry: (params: { page: Page }) => Promise<unknown>;
} => ({
  readSegmentDisplays: async ({ page }: { page: Page }): Promise<readonly unknown[]> =>
    page.evaluate(READ_SEGMENT_DISPLAYS_BROWSER_FN),

  readImageAfterTextGeometry: async ({ page }: { page: Page }): Promise<unknown> =>
    page.evaluate(READ_IMAGE_AFTER_TEXT_GEOMETRY_BROWSER_FN),

  readTextAfterImageGeometry: async ({ page }: { page: Page }): Promise<unknown> =>
    page.evaluate(READ_TEXT_AFTER_IMAGE_GEOMETRY_BROWSER_FN),
});
