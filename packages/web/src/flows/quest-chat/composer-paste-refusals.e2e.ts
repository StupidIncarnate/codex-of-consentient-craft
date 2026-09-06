import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';

const GUILD_PATH = '/tmp/dm-e2e-composer-paste-refusals';
// Small enough that a canvas encode/decode round trip stays fast across the limit tests' 5-6
// sequential pastes.
const IMAGE_SIZE_PX = 20;

// Restated rather than imported: an e2e scenario file measures the USER-FACING copy, so a drift in
// pastedImageStatics.maxImagesPerMessage or chat-composer-statics.ts must fail this file rather
// than silently follow it (see RED FIRST in the flow's authoring notes).
const MAX_IMAGES_PER_MESSAGE = 5;
const TOAST_UNSUPPORTED_FORMAT = 'Only PNG, JPEG, GIF and WebP images can be pasted';
const TOAST_TOO_MANY_IMAGES = 'A message can carry at most 5 images';
const TOAST_CANNOT_REDUCE = 'That image could not be converted or reduced below 5 MB';

// Restated rather than imported: pastedImageStatics.maxBytesPerImage is what the downscale ladder's
// over-size-cap branch checks against, and an e2e proving that branch was actually FORCED (not just
// assumed) has to measure its input against the same threshold the app enforces, independently of
// whether that static ever changes.
const MAX_BYTES_PER_IMAGE = 5_242_880;
// Large enough that PNG signature + IHDR (33 bytes) plus this filler comfortably clears
// MAX_BYTES_PER_IMAGE, with margin — the exact total is measured in the test, never assumed.
const OVER_CAP_FILLER_BYTES = 5_300_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Composer paste — refusals and branches', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('VALID: {type "abcd", ArrowLeft x2, paste "XY"} => text lands at the caret, drafts to localStorage, no image record', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Split Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('abcd');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await composer.pasteText({ text: 'XY' });

    expect(await composer.readComposerTextContent()).toBe('abXYcd');
    expect(await composer.readThumbnailCount()).toBe(0);
    expect(await composer.readDraftText()).toBe('abXYcd');
    expect(await composer.readDraftImageRecords()).toStrictEqual([]);
  });

  test('EMPTY: {clipboard carries only text/plain "hello", composer empty} => text is inserted, the image branch never runs', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste No Image Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    await composer.pasteText({ text: 'hello' });

    expect(await composer.readComposerTextContent()).toBe('hello');
    expect(await composer.readThumbnailCount()).toBe(0);
  });

  test('VALID: {one clipboard carries text/plain AND an image/png File} => the image branch wins, the text is never inserted', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Mixed Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.pasteTextAndImage({ text: 'SHOULD-NOT-APPEAR', dataUrl: String(dataUrl) });

    // The thumbnail insert is the tail of an ASYNC handler (file read + attach broker), so the
    // retrying locator assertion is what waits for it — a bare readThumbnailCount() resolves as
    // soon as the synchronous dispatchEvent() call returns, which can race ahead of that insert.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerTextContent()).toBe('');
  });

  test('VALID: {type "abc", paste "def" with the caret at the end} => the composer reads "abcdef"', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Append Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('abc');

    await composer.pasteText({ text: 'def' });

    expect(await composer.readComposerTextContent()).toBe('abcdef');
  });

  test('VALID: {caret placed between two thumbnails, paste "mid"} => child order becomes [image, text, image] with both srcs unchanged', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Between Guild',
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
    // Waited BEFORE the second paste (not just before the read below): each thumbnail insert is
    // the tail of an async handler, so pasting B before A has landed races the two handlers and
    // can leave A's own attachmentId uncaptured — the exact failure this wait exists to prevent.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    // Captured (not reconstructed) so the "srcs unchanged" half of the assertion below needs no
    // knowledge of the randomly-minted attachmentId — the same object read back must reappear.
    const beforeChildren = await composer.readComposerChildren();

    await composer.placeCaretBetweenChildren({ index: 1 });
    await composer.pasteText({ text: 'mid' });

    const afterChildren = await composer.readComposerChildren();

    expect(afterChildren).toStrictEqual([
      beforeChildren[0],
      { kind: 'text', text: 'mid' },
      beforeChildren[1],
    ]);
  });

  test('VALID: {quest chat page freshly loaded, no draft} => CHAT_INPUT is contenteditable and holds zero thumbnails', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Editable Guild',
      guildPath: GUILD_PATH,
    });

    expect(await composer.readContentEditableAttribute()).toBe('true');
    expect(await composer.readThumbnailCount()).toBe(0);
  });

  test('VALID: {paste a clipboard item of type image/png} => preventDefault fires and CHAT_INPUT holds exactly the managed thumbnail', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Prevented Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    const prevented = await composer.pasteImage({ dataUrl: String(dataUrl) });

    expect(prevented).toBe(false);
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const children = await composer.readComposerChildren();
    expect(children.length).toBe(1);
  });

  test('INVALID: {paste an image/bmp File after typing "abc"} => the unsupported-format toast shows, composer content is untouched', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Format Bad Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('abc');
    const beforeHtml = await composer.readComposerInnerHtml();

    await composer.pasteBytes({ bytes: [0x00, 0x01, 0x02, 0x03], mediaType: 'image/bmp' });

    // The format check runs synchronously (before any await in handlePaste), so the toast paints
    // in the same tick this dispatch resolves; the retry is defensive, not load-bearing here.
    await expect(page.getByText(TOAST_UNSUPPORTED_FORMAT, { exact: true })).toBeVisible();
    expect(await composer.readThumbnailCount()).toBe(0);
    expect(await composer.readComposerInnerHtml()).toBe(beforeHtml);
  });

  // A clipboard file item's declared type carries no information at all when it is empty or
  // whitespace-only — it cannot be accepted as any specific type, so the honest outcome is the
  // format toast, not silent nothing. Real File/Blob objects leave an empty or whitespace-only
  // `type` string untouched (confirmed against Node's own spec-following Blob — unlike a wrong-case
  // type, neither is normalised away by the browser), so this genuinely reproduces the bug: before
  // the fix, handlePaste's item-selection test (`item.type.startsWith('image/')`) rejects both,
  // treats the paste as "no image on the clipboard", and silently falls through to the plain-text
  // branch with nothing to insert — no toast, no thumbnail, no feedback at all.
  test('INVALID: {paste a clipboard file item whose declared type is the empty string, after typing "abc"} => the unsupported-format toast shows, composer content is untouched', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Empty Type Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('abc');
    const beforeHtml = await composer.readComposerInnerHtml();

    await composer.pasteBytes({ bytes: [0x00, 0x01, 0x02, 0x03], mediaType: '' });

    await expect(page.getByText(TOAST_UNSUPPORTED_FORMAT, { exact: true })).toBeVisible();
    expect(await composer.readThumbnailCount()).toBe(0);
    expect(await composer.readComposerInnerHtml()).toBe(beforeHtml);
  });

  test('INVALID: {paste a clipboard file item whose declared type is whitespace-only, after typing "abc"} => the unsupported-format toast shows, composer content is untouched', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Whitespace Type Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    await page.keyboard.type('abc');
    const beforeHtml = await composer.readComposerInnerHtml();

    await composer.pasteBytes({ bytes: [0x00, 0x01, 0x02, 0x03], mediaType: '   ' });

    await expect(page.getByText(TOAST_UNSUPPORTED_FORMAT, { exact: true })).toBeVisible();
    expect(await composer.readThumbnailCount()).toBe(0);
    expect(await composer.readComposerInnerHtml()).toBe(beforeHtml);
  });

  test('VALID: {paste an image/webp File} => a thumbnail is inserted and the unsupported-format toast never fires', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Format Ok Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
      mimeType: 'image/webp',
    });

    await composer.pasteImage({ dataUrl: String(dataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await expect(page.getByText(TOAST_UNSUPPORTED_FORMAT, { exact: true })).toHaveCount(0);
  });

  test('EDGE: {5 thumbnails present, paste a 6th} => too-many-images toast shows, the 5 thumbnails are unchanged, the 6th never lands', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Limit Hit Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    // Sequential by necessity (each paste's existingThumbnailCount guard reads the live DOM count
    // left by the one before it) — expressed as a reduce chain, never a `for`/`while` loop, so
    // there is no loop statement for no-await-in-loop to flag.
    const seeds = Array.from({ length: MAX_IMAGES_PER_MESSAGE }, (_unused, index) => index + 1);
    await seeds.reduce(async (previous, seed) => {
      await previous;
      const dataUrl = await composer.buildImageDataUrl({
        widthPx: IMAGE_SIZE_PX,
        heightPx: IMAGE_SIZE_PX,
        seed,
      });
      await composer.pasteImage({ dataUrl: String(dataUrl) });
      await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(seed);
    }, Promise.resolve());

    const beforeSrcs = await composer.readThumbnailSrcs();
    const sixthDataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: MAX_IMAGES_PER_MESSAGE + 1,
    });

    await composer.pasteImage({ dataUrl: String(sixthDataUrl) });

    await expect(page.getByText(TOAST_TOO_MANY_IMAGES, { exact: true })).toBeVisible();
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(MAX_IMAGES_PER_MESSAGE);
    const afterSrcs = await composer.readThumbnailSrcs();
    expect(afterSrcs).toStrictEqual(beforeSrcs);
    expect(afterSrcs.filter((src) => src === sixthDataUrl).length).toBe(0);
    expect(afterSrcs.filter((src) => src === beforeSrcs[0]).length).toBe(1);
  });

  test('EDGE: {4 thumbnails present, paste a 5th} => thumbnail count reaches the cap, the too-many-images toast never fires', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Limit Ok Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    const roomLeftCount = MAX_IMAGES_PER_MESSAGE - 1;
    const seeds = Array.from({ length: roomLeftCount }, (_unused, index) => index + 1);
    await seeds.reduce(async (previous, seed) => {
      await previous;
      const dataUrl = await composer.buildImageDataUrl({
        widthPx: IMAGE_SIZE_PX,
        heightPx: IMAGE_SIZE_PX,
        seed,
      });
      await composer.pasteImage({ dataUrl: String(dataUrl) });
      await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(seed);
    }, Promise.resolve());

    const fifthDataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: MAX_IMAGES_PER_MESSAGE,
    });

    await composer.pasteImage({ dataUrl: String(fifthDataUrl) });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(MAX_IMAGES_PER_MESSAGE);
    await expect(page.getByText(TOAST_TOO_MANY_IMAGES, { exact: true })).toHaveCount(0);
  });

  // RACE 1: three pastes fired in ONE script with no `await` between the dispatchEvent calls, atop
  // 4 already-sequential (real) thumbnails. Each paste's synchronous prefix — including the
  // existingThumbnailCount read — runs before any of the three reaches its own first `await`, so all
  // three can read the SAME stale count of 4. Sequential pastes (the sibling test above) never
  // exercise this: each one's async work fully resolves before the next one's synchronous prefix
  // ever runs, so the count each of them reads is never stale.
  test('EDGE: {4 thumbnails present, 3 more pastes fired with no await between the dispatchEvent calls} => the composer ends with exactly 5 thumbnails, and a losing paste surfaces the same too-many-images toast a sequential sixth paste gets', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Limit Race Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    const roomLeftCount = MAX_IMAGES_PER_MESSAGE - 1;
    const seeds = Array.from({ length: roomLeftCount }, (_unused, index) => index + 1);
    await seeds.reduce(async (previous, seed) => {
      await previous;
      const dataUrl = await composer.buildImageDataUrl({
        widthPx: IMAGE_SIZE_PX,
        heightPx: IMAGE_SIZE_PX,
        seed,
      });
      await composer.pasteImage({ dataUrl: String(dataUrl) });
      await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(seed);
    }, Promise.resolve());

    // Built up FRONT of the burst — nothing inside the burst itself may await.
    const raceSeeds = [roomLeftCount + 1, roomLeftCount + 2, roomLeftCount + 3];
    const raceDataUrls = await Promise.all(
      raceSeeds.map(async (seed) =>
        composer.buildImageDataUrl({ widthPx: IMAGE_SIZE_PX, heightPx: IMAGE_SIZE_PX, seed }),
      ),
    );

    await composer.pasteImagesWithNoAwaitBetween({
      dataUrls: raceDataUrls.map((dataUrl) => String(dataUrl)),
    });

    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(MAX_IMAGES_PER_MESSAGE);
    // TWO of the three racing pastes lose (only one of the three had room for), so Mantine stacks
    // TWO identical toasts rather than one — `.first()` is what keeps this a check for "the toast
    // fired", not an assertion on how many losers there were.
    await expect(page.getByText(TOAST_TOO_MANY_IMAGES, { exact: true }).first()).toBeVisible();
  });

  test('ERROR: {paste a truncated PNG whose decode throws} => the cannot-reduce toast shows and no thumbnail is inserted', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Corrupt Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    await composer.pasteCorruptPng();

    await expect(page.getByText(TOAST_CANNOT_REDUCE, { exact: true })).toBeVisible();
    expect(await composer.readThumbnailCount()).toBe(0);
  });

  test('ERROR: {paste bytes whose PNG signature and IHDR declare a large image but whose total length exceeds 5 MB with no decodable stream after it} => the downscale-failed branch is actually forced (input measured over the cap first), the exact reduce-limit toast shows, and no thumbnail lands', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });
    await composer.openComposerPage({
      request,
      guildName: 'Composer Paste Over Cap Corrupt Guild',
      guildPath: GUILD_PATH,
    });
    await composer.focusComposer();

    // Measured, not assumed: this is what proves the input actually enters the "over 5 MB" edge of
    // over-size-cap before decode ever fails, distinguishing it from the small truncated PNG above
    // (which never clears the cap at all, so it can only prove the corrupt-format toast, never the
    // over-cap one).
    const byteLength = await composer.buildOverCapCorruptPngByteLength({
      fillerBytes: OVER_CAP_FILLER_BYTES,
    });
    expect(byteLength).toBeGreaterThan(MAX_BYTES_PER_IMAGE);

    await composer.pasteOverCapCorruptPng({ fillerBytes: OVER_CAP_FILLER_BYTES });

    await expect(page.getByText(TOAST_CANNOT_REDUCE, { exact: true })).toBeVisible();
    expect(await composer.readThumbnailCount()).toBe(0);
  });
});
