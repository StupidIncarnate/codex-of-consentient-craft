import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-transcript-image-overlay';
const PANEL_TIMEOUT = 8_000;
const SQUARE_IMAGE_SIZE_PX = 20;
const WIDE_IMAGE_WIDTH_PX = 2000;
const WIDE_IMAGE_HEIGHT_PX = 200;
const TALL_IMAGE_WIDTH_PX = 200;
const TALL_IMAGE_HEIGHT_PX = 1400;
const NARROWER_VIEWPORT_WIDTH_PX = 1000;
// Well inside the dimmed backdrop for any modal this suite opens: the modal is `centered`, so its
// content box's left edge sits at (viewportWidth - contentWidth) / 2, which stays well clear of this
// coordinate for every viewport width this file uses.
const OUTSIDE_CLICK_COORD_PX = 2;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Transcript image overlay', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {an unopened overlay, click the transcript thumbnail} => IMAGE_OVERLAY count goes from 0 to 1, forcing the click branch rather than assuming it', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Branch Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'branch.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-branch-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(0);
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(1);
  });

  test("VALID: {two byte-distinct images in one message, click the SECOND thumbnail} => IMAGE_OVERLAY_IMAGE's src is exactly the second image's expected URL", async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Correct Image Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const first = images.seedImageFile({
      fileName: 'ov-first.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const second = images.seedImageFile({
      fileName: 'ov-second.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 2,
    });
    expect(first.bytes.equals(second.bytes)).toBe(false);

    const content = images.buildTokenLine({
      segments: [
        { imagePath: String(first.imagePath), ordinal: 1 },
        { imagePath: String(second.imagePath), ordinal: 2 },
      ],
    });

    const sessionId = `e2e-session-overlay-correct-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const secondUrl = String(images.buildExpectedImageUrl({ imagePath: String(second.imagePath) }));

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(2, {
      timeout: PANEL_TIMEOUT,
    });

    await page.getByTestId('CHAT_MESSAGE_IMAGE').nth(1).click();

    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();
    expect(await page.getByTestId('IMAGE_OVERLAY_IMAGE').getAttribute('src')).toBe(secondUrl);
  });

  test("VALID: {open the overlay, measure at two different viewport widths} => .mantine-Modal-content's width equals overlayWidthPercent percent of the modal's available inner width at each", async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Width Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'width.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-width-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const overlayWidthPercent = Number(images.getOverlayWidthPercent());
    const firstViewportHeight = Number(images.readViewportHeight({ page }));

    // `.mantine-Modal-content`'s percentage `size` resolves against `.mantine-Modal-inner`'s
    // available (padding-excluded) width, not the bare window width — see
    // READ_MODAL_INNER_AVAILABLE_WIDTH_BROWSER_FN in the harness for the measured proof. Re-reading
    // it fresh at each viewport (rather than deriving it from viewport width by formula) is what
    // keeps this assertion correct regardless of Mantine's own fixed offset padding.
    const firstAvailableWidth = Number(await images.readModalInnerAvailableWidth({ page }));
    const firstExpectedWidth = Math.round((firstAvailableWidth * overlayWidthPercent) / 100);
    await expect
      .poll(async () => Math.round(Number(await images.readModalContentWidth({ page }))))
      .toBe(firstExpectedWidth);

    await page.setViewportSize({
      width: NARROWER_VIEWPORT_WIDTH_PX,
      height: firstViewportHeight,
    });

    const secondAvailableWidth = Number(await images.readModalInnerAvailableWidth({ page }));
    const secondExpectedWidth = Math.round((secondAvailableWidth * overlayWidthPercent) / 100);
    await expect
      .poll(async () => Math.round(Number(await images.readModalContentWidth({ page }))))
      .toBe(secondExpectedWidth);
  });

  test("VALID: {open the overlay} => IMAGE_OVERLAY's computed maxHeight equals viewportHeight * overlayMaxHeightPercent / 100 in px", async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Max Height Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'max-height.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-max-height-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const overlayMaxHeightPercent = Number(images.getOverlayMaxHeightPercent());
    const viewportHeight = Number(images.readViewportHeight({ page }));
    const expectedMaxHeight = `${Math.round((viewportHeight * overlayMaxHeightPercent) / 100)}px`;

    await expect
      .poll(async () => images.readOverlayComputedMaxHeight({ page }))
      .toBe(expectedMaxHeight);
  });

  test('VALID: {an image wider than the viewport} => the overlay image is naturally oversized but its rendered width stays at most the modal content width', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Fits Width Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'wide.png',
      widthPx: WIDE_IMAGE_WIDTH_PX,
      heightPx: WIDE_IMAGE_HEIGHT_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-wide-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const viewportWidth = Number(images.readViewportWidth({ page }));
    await expect
      .poll(async () => Number(await images.readOverlayImageNaturalWidth({ page })))
      .toBeGreaterThan(viewportWidth);

    const modalContentWidth = Number(await images.readModalContentWidth({ page }));
    const overlayImageWidth = Number(await images.readOverlayImageWidth({ page }));
    expect(overlayImageWidth).toBeLessThanOrEqual(modalContentWidth);
  });

  test('VALID: {an image taller than 90 percent of the viewport} => IMAGE_OVERLAY scrolls, and its own height stays within the overlayMaxHeightPercent cap', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Tall Scrolls Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'tall.png',
      widthPx: TALL_IMAGE_WIDTH_PX,
      heightPx: TALL_IMAGE_HEIGHT_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-tall-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    await expect.poll(async () => images.readOverlayCanScroll({ page })).toBe(true);

    const overlayMaxHeightPercent = Number(images.getOverlayMaxHeightPercent());
    const viewportHeight = Number(images.readViewportHeight({ page }));
    const cap = Math.round((viewportHeight * overlayMaxHeightPercent) / 100);
    // Rounded before comparing: a real Chromium layout can report a sub-pixel remainder
    // (e.g. 648.0000114) on an exact-integer cap from device-pixel-ratio rounding inside the
    // browser's own layout math — noise the cap calculation never introduces on its own.
    const overlayHeight = Math.round(Number(await images.readOverlayHeight({ page })));
    expect(overlayHeight).toBeLessThanOrEqual(cap);
  });

  test('VALID: {open the overlay} => IMAGE_OVERLAY_CLOSE is visible with a non-zero-area box', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Close Visible Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'close-visible.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-close-visible-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    await expect(page.getByTestId('IMAGE_OVERLAY_CLOSE')).toBeVisible();
    expect(await images.readOverlayCloseHasNonZeroArea({ page })).toBe(true);
  });

  test('VALID: {open the overlay, press Escape} => IMAGE_OVERLAY is gone and the transcript image is still visible with a loaded natural width', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Escape Closes Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'escape.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-escape-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(0);
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toBeVisible();
    await expect
      .poll(async () => images.readNaturalWidth({ page, index: 0 }))
      .toBe(SQUARE_IMAGE_SIZE_PX);
  });

  test('VALID: {click the overlay image, then click outside the modal content} => the inside click leaves it open and the outside click closes it', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Click Outside Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'click-outside.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-click-outside-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    await page.getByTestId('IMAGE_OVERLAY_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(1);

    const modalContentX = Number(await images.readModalContentX({ page }));
    expect(modalContentX).toBeGreaterThan(OUTSIDE_CLICK_COORD_PX);

    await page.mouse.click(OUTSIDE_CLICK_COORD_PX, OUTSIDE_CLICK_COORD_PX);
    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(0);
  });

  test('VALID: {click IMAGE_OVERLAY_CLOSE} => the overlay is gone and the transcript image is still rendered', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Overlay Close Button Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'close-button.png',
      widthPx: SQUARE_IMAGE_SIZE_PX,
      heightPx: SQUARE_IMAGE_SIZE_PX,
      seed: 1,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-overlay-close-button-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });
    await page.getByTestId('CHAT_MESSAGE_IMAGE').click();
    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();

    await page.getByTestId('IMAGE_OVERLAY_CLOSE').click();

    await expect(page.getByTestId('IMAGE_OVERLAY')).toHaveCount(0);
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toBeVisible();
  });
});
