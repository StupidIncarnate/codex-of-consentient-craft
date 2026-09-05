import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';
// The tall-image case below needs the actual configured cap to assert against — reading it here
// (rather than hardcoding 200) is what keeps the assertion tied to the real static instead of a
// copy that can silently drift from it. Mirrors transcript-images.harness.ts's own reasoning for
// reaching into this package-local static directly (see that file's header on the overlay knobs).
import { webConfigStatics } from '../../statics/web-config/web-config-statics';

const GUILD_PATH = '/tmp/dm-e2e-transcript-broken-image';
const PANEL_TIMEOUT = 8_000;
const IMAGE_SIZE_PX = 8;
// Narrow and very tall — the aspect ratio a full-page screenshot paste has (roughly 1000x4000 in
// the wild). Width stays small purely so the real PNG encode/deflate in the harness stays fast;
// what this case is proving only depends on the image being far taller than the inline cap.
const TALL_IMAGE_WIDTH_PX = 8;
const TALL_IMAGE_HEIGHT_PX = 4000;
// A missing-file 404 answers with an EMPTY body and an internally "no Content-Type" intent (see
// image-serve-responder.ts's contentType:null), but @hono/node-server defaults an empty-headers
// Uint8Array-body response to this exact wire value regardless — verified directly against the
// installed @hono/node-server + hono packages. A header IS present; it is just never one of the
// image types, so asserting the real wire value here is what keeps this a regression guard rather
// than a check that quietly stops matching reality.
const NO_CONTENT_TYPE_WIRE_VALUE = 'text/plain; charset=UTF-8';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Transcript broken image', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('EMPTY: {a pasted-image token naming a path that no longer exists} => the browser requests it and receives a real 404 with a zero-length body', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Broken Image Not Readable Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'will-be-missing.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    images.removeImageFile({ imagePath: String(seeded.imagePath) });

    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });
    const sessionId = `e2e-session-broken-not-readable-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const expectedUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }),
    );
    const responsePromise = page.waitForResponse((response) => response.url() === expectedUrl);

    await nav.navigateToSession({ urlSlug, sessionId });

    const response = await responsePromise;
    const body = await response.body();

    expect({ status: response.status(), bodyLength: body.length }).toStrictEqual({
      status: 404,
      bodyLength: 0,
    });
  });

  test('VALID: {content "A" + a missing image + "B"} => IMAGE_CONTENT_LAYER child order is exactly [text A, the broken placeholder, text B]', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({ name: 'Broken Image Order Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'order-missing.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    images.removeImageFile({ imagePath: String(seeded.imagePath) });

    const content = images.buildTokenLine({
      segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
    });
    const sessionId = `e2e-session-broken-order-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'A', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'span', text: '', testId: 'CHAT_MESSAGE_IMAGE_BROKEN', src: '' },
      { tag: 'span', text: 'B', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
  });

  test('VALID: {a missing image, tab brought to front} => the broken placeholder measures exactly brokenThumbnailSizePx wide and brokenThumbnailSizePx tall', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({ name: 'Broken Image Size Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'size-missing.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    images.removeImageFile({ imagePath: String(seeded.imagePath) });

    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });
    const sessionId = `e2e-session-broken-size-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    // A backgrounded tab reports a zero-area box for everything, including a correctly-sized
    // placeholder — this preamble is what rules that out before the boundingBox() read below.
    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const sizePx = Number(images.getBrokenThumbnailSizePx());
    const box = await images.readBrokenThumbnailBoundingBox({ page });
    expect(box).toStrictEqual({ width: sizePx, height: sizePx });
  });

  test('VALID: {one message holding a real image and a missing image} => the real image still loads at its natural size while only the missing one renders broken', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({ name: 'Broken Image Mixed Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const goodSeeded = images.seedImageFile({
      fileName: 'mixed-good.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 5,
    });
    const badSeeded = images.seedImageFile({
      fileName: 'mixed-missing.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 6,
    });
    images.removeImageFile({ imagePath: String(badSeeded.imagePath) });

    const content = images.buildTokenLine({
      segments: [
        { imagePath: String(goodSeeded.imagePath), ordinal: 1 },
        { imagePath: String(badSeeded.imagePath), ordinal: 2 },
      ],
    });
    const sessionId = `e2e-session-broken-mixed-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1);

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(IMAGE_SIZE_PX);
  });

  test('VALID: {a message with one missing image} => the 404 is real with no image Content-Type, the placeholder sits at the seeded size in place, surrounding text renders, the bubble count stays one, and no unhandled exception is recorded', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Broken Image Terminal Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'terminal-missing.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 9,
    });
    images.removeImageFile({ imagePath: String(seeded.imagePath) });

    const content = images.buildTokenLine({
      segments: [
        { text: 'Before ' },
        { imagePath: String(seeded.imagePath), ordinal: 1 },
        { text: ' After' },
      ],
    });
    const sessionId = `e2e-session-broken-terminal-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const expectedUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }),
    );
    const pageErrors = images.recordPageErrors({ page });
    const responsePromise = page.waitForResponse((response) => response.url() === expectedUrl);

    await nav.navigateToSession({ urlSlug, sessionId });

    const response = await responsePromise;
    const body = await response.body();
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    expect({
      status: response.status(),
      bodyLength: body.length,
      contentType: response.headers()['content-type'],
    }).toStrictEqual({ status: 404, bodyLength: 0, contentType: NO_CONTENT_TYPE_WIRE_VALUE });

    const sizePx = Number(images.getBrokenThumbnailSizePx());
    const box = await images.readBrokenThumbnailBoundingBox({ page });
    expect(box).toStrictEqual({ width: sizePx, height: sizePx });

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'Before ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'span', text: '', testId: 'CHAT_MESSAGE_IMAGE_BROKEN', src: '' },
      { tag: 'span', text: ' After', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);

    await expect(page.getByTestId('CHAT_MESSAGE')).toHaveCount(1);
    expect(pageErrors.getErrors()).toStrictEqual([]);
  });

  test('VALID: {a real image far taller than the inline cap} => the rendered bubble caps its height at inlineImageMaxHeightPx while the file itself decodes far taller', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({ name: 'Tall Image Guild', path: GUILD_PATH });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'tall-screenshot.png',
      widthPx: TALL_IMAGE_WIDTH_PX,
      heightPx: TALL_IMAGE_HEIGHT_PX,
      seed: 7,
    });

    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });
    const sessionId = `e2e-session-tall-image-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, { timeout: PANEL_TIMEOUT });

    // Confirms the browser actually decoded the real, full-height file (not a placeholder or a
    // partial fetch) before measuring what the CSS cap did to its RENDERED box — the naturalWidth
    // poll is the same "really loaded" gate the mixed-images case above uses.
    await expect
      .poll(async () => images.readNaturalWidth({ page, index: 0 }))
      .toBe(TALL_IMAGE_WIDTH_PX);

    const naturalHeight = await page.evaluate(() => {
      const image = document.querySelector('[data-testid="CHAT_MESSAGE_IMAGE"]');
      if (!(image instanceof HTMLImageElement)) {
        throw new Error(
          'transcript-broken-image: CHAT_MESSAGE_IMAGE not found or not an <img> element',
        );
      }
      return image.naturalHeight;
    });

    const box = await page.getByTestId('CHAT_MESSAGE_IMAGE').boundingBox();
    if (box === null) {
      throw new Error('transcript-broken-image: CHAT_MESSAGE_IMAGE bounding box not available');
    }

    // Without the cap this used to render at its natural ~4000px height, burying the transcript
    // under one bubble — so the case only bites if BOTH halves hold: the file really did decode
    // far taller than the cap, AND the rendered box was actually held down to it.
    expect({
      naturalHeight,
      renderedHeightAtMostCap: box.height <= webConfigStatics.pastedImage.inlineImageMaxHeightPx,
      naturalHeightFarExceedsCap:
        naturalHeight > webConfigStatics.pastedImage.inlineImageMaxHeightPx,
    }).toStrictEqual({
      naturalHeight: TALL_IMAGE_HEIGHT_PX,
      renderedHeightAtMostCap: true,
      naturalHeightFarExceedsCap: true,
    });
  });
});
