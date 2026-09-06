import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';

const GUILD_PATH = '/tmp/dm-e2e-composer-paste-multiple-images';
const IMAGE_SIZE_PX = 20;

// Restated rather than imported: an e2e scenario file measures the USER-FACING copy, so a drift in
// chat-composer-statics.ts's toast text must fail this file rather than silently follow it (see
// RED FIRST in the flow's authoring notes).
const TOAST_UNSUPPORTED_FORMAT = 'Only PNG, JPEG, GIF and WebP images can be pasted';
const TOAST_TOO_MANY_IMAGES = 'A message can carry at most 5 images';
const TOAST_CANNOT_REDUCE = 'That image could not be converted or reduced below 5 MB';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

// A PNG source round-trips through Chromium's canvas encoder byte-for-byte at identical dimensions
// whether or not a re-encode actually ran on it — so the one assertion here that needs to catch a
// re-encode on the SECOND identical paste (check-same-clipboard-twice-same-bytes) uses a JPEG
// source instead: the downscale ladder's first re-encode attempt always emits PNG, which a JPEG
// source can never be byte-identical to.
const JPEG_DATA_URL_PREFIX = 'data:image/jpeg;base64,';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Composer paste — multiple images', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('VALID: {type "A", paste image 1, type "B", paste image 2, type "C"} => composer holds text plus 2 inline thumbnails: exact child order, exact draft text, exactly 2 IndexedDB records in order, no toast, SEND_BUTTON enabled', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Multi Ready Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);
    await page.keyboard.type('C');

    // Precondition, measured rather than assumed: the two source images are byte-distinct, built
    // from different seeds (#composer-ready).
    expect(dataUrlA === dataUrlB).toBe(false);

    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'text', text: 'A' },
      { kind: 'image', src: dataUrlA },
      { kind: 'text', text: 'B' },
      { kind: 'image', src: dataUrlB },
      { kind: 'text', text: 'C' },
    ]);
    expect(await composer.readDraftText()).toBe('A[Pasted Image 1]B[Pasted Image 2]C');

    // Exactly 2 IndexedDB records, in the same order as the 2 rendered thumbnails — a store holding
    // the wrong count or the wrong order is an orphaned or misattributed attachment a send would
    // carry short.
    const thumbnailIds = await composer.readThumbnailAttachmentIds();
    const draftIds = await composer.readDraftImageAttachmentIds();
    expect(draftIds).toStrictEqual(thumbnailIds);

    await expect(page.getByText(TOAST_UNSUPPORTED_FORMAT, { exact: true })).toHaveCount(0);
    await expect(page.getByText(TOAST_TOO_MANY_IMAGES, { exact: true })).toHaveCount(0);
    await expect(page.getByText(TOAST_CANNOT_REDUCE, { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled();
  });

  test('VALID: {type "A", paste image 1, type "B", paste image 2, type "C"} => child order is exactly text "A", thumbnail 1, text "B", thumbnail 2, text "C", each thumbnail matching its own byte-distinct source', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Multi Keep Places Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);
    await page.keyboard.type('C');

    expect(dataUrlA === dataUrlB).toBe(false);
    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'text', text: 'A' },
      { kind: 'image', src: dataUrlA },
      { kind: 'text', text: 'B' },
      { kind: 'image', src: dataUrlB },
      { kind: 'text', text: 'C' },
    ]);
  });

  test('VALID: {paste the identical clipboard item twice} => two thumbnails, not one', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Multi Same Clipboard Count Guild',
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
    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);
  });

  test('VALID: {paste the identical clipboard item twice} => the two thumbnails carry different attachmentIds', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Multi Same Clipboard Ids Guild',
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
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    const attachmentIds = await composer.readThumbnailAttachmentIds();
    const [idA, idB] = attachmentIds;
    expect(new Set([idA, idB]).size).toBe(2);
    expect(idA).toMatch(UUID_PATTERN);
    expect(idB).toMatch(UUID_PATTERN);
  });

  test("VALID: {paste the identical clipboard item twice} => both thumbnails' bytes are byte-for-byte equal to each other and to the source", async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Multi Same Clipboard Bytes Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
      mimeType: 'image/jpeg',
    });
    // Precondition, measured rather than assumed: see the JPEG_DATA_URL_PREFIX note above — this is
    // what lets a re-encode on the second pass be told apart from an untouched attach.
    expect(String(dataUrl).slice(0, JPEG_DATA_URL_PREFIX.length)).toBe(JPEG_DATA_URL_PREFIX);

    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    expect(await composer.readThumbnailSrcs()).toStrictEqual([dataUrl, dataUrl]);
  });

  test('VALID: {type "text", paste the identical clipboard item twice} => serialising the composer yields "text[Pasted Image 1][Pasted Image 2]"', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Multi Same Clipboard Numbered Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('text');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    expect(await composer.readDraftText()).toBe('text[Pasted Image 1][Pasted Image 2]');
  });
});
