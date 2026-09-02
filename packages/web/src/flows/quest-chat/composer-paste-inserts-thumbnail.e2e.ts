import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';

const GUILD_PATH = '/tmp/dm-e2e-composer-paste-inserts-thumbnail';

// Restated rather than imported: an e2e scenario file measures the USER-FACING behaviour, so a drift
// in pastedImageStatics.maxBytesPerImage/maxLongestEdgePx or chat-composer-statics.ts's toast copy
// must fail this file rather than silently follow it (see RED FIRST in the flow's authoring notes).
const MAX_BYTES_PER_IMAGE = 5_242_880;
const MAX_LONGEST_EDGE_PX = 2000;
const TOAST_CANNOT_REDUCE = 'That image could not be converted or reduced below 5 MB';

// A 40x30 PNG round-trips through Chromium's canvas encoder byte-for-byte whether or not the
// downscale ladder actually ran on it — at identical dimensions that re-encode is deterministic and
// lossless, so a PNG source can never discriminate "ladder skipped" from "ladder ran and produced
// the same bytes". The ladder's first re-encode attempt always emits PNG regardless of the source's
// own format, so a JPEG source is what turns red when the branch runs and stays green when it does
// not — see #size-ok below.
const JPEG_DATA_URL_PREFIX = 'data:image/jpeg;base64,';

const IMAGE_SIZE_PX = 20;
const UNDER_CAP_WIDTH_PX = 40;
const UNDER_CAP_HEIGHT_PX = 30;
const OVER_CAP_WIDTH_PX = 6000;
const OVER_CAP_HEIGHT_PX = 4000;
const OVER_CAP_NOISE_BAND_ROWS = 700;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Composer paste — inserts a thumbnail', () => {
  // Only the over-cap walk-path test (a 6000x4000 canvas build + PNG encode + two decode/re-encode
  // passes through the downscale ladder) needs headroom past the config's 10s default; raised for
  // the whole describe block rather than per-test test.slow(), matching this repo's dominant
  // convention for a file that carries one genuinely heavy case among several fast ones.
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('VALID: {paste a 40x30 JPEG well under 5 MB} => over-size-cap takes the "at or under 5 MB" edge: the thumbnail is inserted unresized and still declares image/jpeg, proving the ladder never touched it', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Size Ok Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: UNDER_CAP_WIDTH_PX,
      heightPx: UNDER_CAP_HEIGHT_PX,
      seed: 1,
      mimeType: 'image/jpeg',
    });
    // Precondition, measured rather than assumed: Chromium supports image/jpeg for canvas.toBlob but
    // silently falls back to image/png for a type it doesn't support — confirm the harness actually
    // produced a JPEG before relying on that format surviving untouched as the branch discriminator.
    expect(String(dataUrl).slice(0, JPEG_DATA_URL_PREFIX.length)).toBe(JPEG_DATA_URL_PREFIX);

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    // #size-ok: byte-for-byte the source JPEG data URL — if the downscale ladder had run on an
    // under-cap image, this would instead be a re-encoded image/png data URL.
    expect(await composer.readThumbnailSrcs()).toStrictEqual([dataUrl]);
    expect(await composer.readThumbnailNaturalWidths()).toStrictEqual([UNDER_CAP_WIDTH_PX]);
    expect(await composer.readThumbnailNaturalHeights()).toStrictEqual([UNDER_CAP_HEIGHT_PX]);
  });

  test('EDGE: {paste a 6000x4000 PNG whose source exceeds 5 MB} => over-size-cap takes the "over 5 MB" edge into downscale-image, which succeeds: longest edge caps at 2000px, decoded bytes land at or under 5 MB, and the cannot-reduce toast never fires', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Size Over Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    const dataUrl = await composer.buildOverCapImageDataUrl({
      widthPx: OVER_CAP_WIDTH_PX,
      heightPx: OVER_CAP_HEIGHT_PX,
      noiseBandRows: OVER_CAP_NOISE_BAND_ROWS,
    });
    // Measured, not assumed: proves the source actually enters the "over 5 MB" edge before anything
    // about the downscale outcome is asserted (#size-over precondition).
    const sourceByteLength = await composer.readDataUrlByteLength({ dataUrl: String(dataUrl) });
    expect(sourceByteLength).toBeGreaterThan(MAX_BYTES_PER_IMAGE);

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    // The insert is the tail of an async handler (measure, then a PNG re-encode at the cap) — the
    // retrying locator is what waits for it, never a one-shot readThumbnailCount().
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    // #downscale-ok: the failure branch's toast never fired.
    await expect(page.getByText(TOAST_CANNOT_REDUCE, { exact: true })).toHaveCount(0);

    // #size-over / #check-downscale-caps-longest-edge: capped at maxLongestEdgePx, never the
    // source's own 6000.
    expect(await composer.readThumbnailNaturalWidths()).toStrictEqual([MAX_LONGEST_EDGE_PX]);

    // #check-downscale-lands-under-cap: the resulting attachment's own decoded bytes, not the
    // source's, land at or under the cap.
    const resultSrcs = await composer.readThumbnailSrcs();
    const resultByteLength = await composer.readDataUrlByteLength({
      dataUrl: String(resultSrcs[0]),
    });
    expect(resultByteLength).toBeGreaterThan(0);
    expect(resultByteLength).toBeLessThanOrEqual(MAX_BYTES_PER_IMAGE);
  });

  test('VALID: {type "beforeafter", ArrowLeft x5, paste an image} => the thumbnail lands at the caret: child order becomes text "before", thumbnail, text "after"', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Caret Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('beforeafter');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'text', text: 'before' },
      { kind: 'image', src: dataUrl },
      { kind: 'text', text: 'after' },
    ]);
  });

  test('VALID: {paste an image} => the thumbnail carries no remove control: zero button descendants, zero buttons anywhere in CHAT_INPUT, while SEND_BUTTON still exists outside it', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert No Remove Control Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readThumbnailChildElementCounts()).toStrictEqual([0]);
    await expect(page.getByTestId('CHAT_INPUT').locator('button')).toHaveCount(0);
    await expect(page.getByTestId('SEND_BUTTON')).toHaveCount(1);
  });

  test('VALID: {paste into an empty composer, then type "x"} => the caret sits after the thumbnail: child order becomes thumbnail, text "x"', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Caret After Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('x');

    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'image', src: dataUrl },
      { kind: 'text', text: 'x' },
    ]);
  });

  test('VALID: {paste into an empty composer, then type "x" with no space keyed} => the "x" lands as its own sibling text node rather than inside the thumbnail element', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert No Space Needed Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('x');

    expect(await composer.readComposerChildNodeDetails()).toStrictEqual([
      { nodeType: 1, nodeValue: null, textContent: '', tagName: 'IMG' },
      { nodeType: 3, nodeValue: 'x', textContent: 'x', tagName: null },
    ]);
  });

  test('VALID: {type "a", then a space, then paste an image} => the space before the thumbnail survives: the text node reads exactly "a " with its trailing space intact', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Space Before Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('a ');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerChildNodeDetails()).toStrictEqual([
      { nodeType: 3, nodeValue: 'a ', textContent: 'a ', tagName: null },
      { nodeType: 1, nodeValue: null, textContent: '', tagName: 'IMG' },
    ]);
  });

  test('VALID: {paste an image, then type a space followed by "b"} => the thumbnail sits first and the text following it reads exactly " b", the leading space intact rather than collapsed', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Space After Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type(' b');

    // Real Chromium splits ' ' and 'b' into two separate sibling text nodes here —
    // domComposerInsertTextAdapter always calls document.createTextNode for an intercepted keystroke
    // and never merges into a non-empty adjacent text node. That split is not a product defect: the
    // composer's own reader merges adjacent text nodes, so the user-visible and serialised text are
    // both ' b' with the leading space intact. Assert the SERIALISED text (readComposerTextContent
    // concatenates character content across node boundaries the same way a reader does) rather than
    // the node structure, and assert the thumbnail is what actually precedes it.
    const summaries = await composer.readComposerChildSummaries();
    expect(summaries[0]).toStrictEqual({ kind: 'image', src: dataUrl });
    const attachmentIds = await composer.readThumbnailAttachmentIds();
    expect(attachmentIds[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u,
    );
    expect(await composer.readComposerTextContent()).toBe(' b');
  });

  test('VALID: {type "abcd", ArrowLeft x2, paste an image} => pasting mid-word splits cleanly: child order becomes text "ab", thumbnail, text "cd", with neither half lost', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Mid Word Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('abcd');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'text', text: 'ab' },
      { kind: 'image', src: dataUrl },
      { kind: 'text', text: 'cd' },
    ]);
  });

  test('VALID: {paste twice with no keystroke between} => two adjacent thumbnails leave zero text nodes between or beside them', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Insert Adjacent Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });

    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'image', src: dataUrlA },
      { kind: 'image', src: dataUrlB },
    ]);
  });
});
