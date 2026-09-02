import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';

const GUILD_PATH = '/tmp/dm-e2e-composer-paste-delete-and-overlay';
const IMAGE_SIZE_PX = 20;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Composer paste — delete a thumbnail, and open the overlay from the composer', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('VALID: {build "a" + thumbnail + "b", caret directly after the thumbnail, press Backspace once} => the thumbnail is gone: textContent exactly "ab", thumbnail count 0, draft text exactly "ab", zero IndexedDB image records', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Terminal Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('a');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('b');

    // Directly after the thumbnail (between child[1] and child[2]: text "a", thumbnail, text "b").
    await composer.placeCaretBetweenChildren({ index: 2 });
    await page.keyboard.press('Backspace');

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
    expect(await composer.readComposerTextContent()).toBe('ab');
    expect(await composer.readDraftText()).toBe('ab');
    expect(await composer.readDraftImageAttachmentIds()).toStrictEqual([]);
  });

  test('VALID: {caret directly after a thumbnail, press Backspace; then caret directly before a thumbnail, press Delete} => both keys take the thumbnail count from 1 to 0', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Both Keys Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('a');
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('b');

    // Backspace: caret directly after the thumbnail.
    await composer.placeCaretBetweenChildren({ index: 2 });
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);

    // The adapter's post-delete caret lands exactly between the merged "a"/"b" text — pasting here
    // re-splits it back into text "a", thumbnail, text "b", giving Delete the same shape to work on.
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    // Delete: caret directly before the thumbnail.
    await composer.placeCaretBetweenChildren({ index: 1 });
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
  });

  test('VALID: {click a thumbnail sitting in the composer} => IMAGE_OVERLAY is not mounted before the click and is visible after', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Click Opens Overlay Guild',
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

    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(0);
    await page.getByTestId('CHAT_INPUT_THUMBNAIL').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();
  });

  test('VALID: {caret directly after a thumbnail in "a" + thumbnail + "b"} => a single Backspace removes the whole thumbnail element in one keystroke', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete One Keystroke Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('a');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('b');

    await composer.placeCaretBetweenChildren({ index: 2 });
    await page.keyboard.press('Backspace');

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
  });

  test('VALID: {removing the thumbnail from composer content "a" + thumbnail + "b"} => the composer reads exactly "ab"', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Text Survives Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('a');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('b');

    await composer.placeCaretBetweenChildren({ index: 2 });
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);

    expect(await composer.readComposerTextContent()).toBe('ab');
  });

  test('VALID: {backspace a thumbnail away from a single-attachment composer} => the IndexedDB draft store holds the attachmentId before and zero records after', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Draft Empty Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('a');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('b');

    const [removedId] = await composer.readThumbnailAttachmentIds();
    // Before: the same read this test asserts empty later already holds the attachment — proving
    // the later empty result is a real state change, not a broken read.
    expect(await composer.readDraftImageAttachmentIds()).toStrictEqual([removedId]);

    await composer.placeCaretBetweenChildren({ index: 2 });
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);

    expect(await composer.readDraftImageAttachmentIds()).toStrictEqual([]);
  });

  test('VALID: {two byte-distinct thumbnails, delete the first via Backspace} => the IndexedDB draft store keeps exactly the second attachmentId', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Keeps Remaining Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    // Precondition, measured rather than assumed: the two source images are byte-distinct.
    expect(dataUrlA === dataUrlB).toBe(false);

    const [, secondAttachmentId] = await composer.readThumbnailAttachmentIds();

    // Directly after the FIRST thumbnail (the two thumbnails are adjacent, no text node between).
    await composer.placeCaretBetweenChildren({ index: 1 });
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    expect(await composer.readDraftImageAttachmentIds()).toStrictEqual([secondAttachmentId]);
  });

  test("VALID: {two byte-distinct thumbnails, click the second} => IMAGE_OVERLAY is visible and IMAGE_OVERLAY_IMAGE's src is exactly the second thumbnail's src", async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Delete Click Correct Image Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    expect(dataUrlA === dataUrlB).toBe(false);
    const [, secondSrc] = await composer.readThumbnailSrcs();

    await page.getByTestId('CHAT_INPUT_THUMBNAIL').nth(1).click();

    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();
    expect(await page.getByTestId('IMAGE_OVERLAY_IMAGE').getAttribute('src')).toBe(secondSrc);
  });
});
