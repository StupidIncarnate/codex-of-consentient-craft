import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-transcript-renders-images';
const PANEL_TIMEOUT = 8_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Transcript renders images', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {navigate /:guildSlug/quest/:questId then /:guildSlug/session/:sessionId} => CHAT_PANEL renders on both routes, with CHAT_INPUT mounted only on the quest route', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Images Panel Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Transcript Images Panel Quest',
      userRequest: 'Build the feature',
    });

    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT')).toHaveCount(1);

    const orphanSessionId = `e2e-session-transcript-panel-${Date.now()}`;
    sessions.createSessionFile({ sessionId: orphanSessionId, userMessage: 'Placeholder message' });

    await nav.navigateToSession({ urlSlug, sessionId: orphanSessionId });
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT')).toHaveCount(0);
  });

  test("VALID: {open an orphan session route} => the browser sends exactly one replay-history frame carrying this sessionId and this guild's id", async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Images Frame Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-session-transcript-frame-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Placeholder message' });

    const replay = images.recordReplayFrames({ page });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect.poll(() => replay.getFrames().length, { timeout: PANEL_TIMEOUT }).toBe(1);
    expect(replay.getFrames()).toStrictEqual([
      { type: 'replay-history', sessionId, guildId, chatProcessId: `replay-${sessionId}` },
    ]);
  });

  test('VALID: {message "this image A vs this image B" with two byte-distinct images} => both images render inline between their sentence halves with srcs in composed order, the readable branch is forced through a real 200 response, both images actually load, and the walk records zero console errors', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Images Terminal Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const first = images.seedImageFile({
      fileName: 'first.png',
      widthPx: 16,
      heightPx: 16,
      seed: 1,
    });
    const second = images.seedImageFile({
      fileName: 'second.png',
      widthPx: 24,
      heightPx: 24,
      seed: 2,
    });
    expect(first.bytes.equals(second.bytes)).toBe(false);

    const content = images.buildTokenLine({
      segments: [
        { text: 'this image ' },
        { imagePath: String(first.imagePath), ordinal: 1 },
        { text: ' vs this image ' },
        { imagePath: String(second.imagePath), ordinal: 2 },
      ],
    });

    const sessionId = `e2e-session-transcript-two-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const firstUrl = String(images.buildExpectedImageUrl({ imagePath: String(first.imagePath) }));
    const secondUrl = String(images.buildExpectedImageUrl({ imagePath: String(second.imagePath) }));

    const consoleErrors = images.recordConsoleErrors({ page });
    const firstResponsePromise = page.waitForResponse((response) => response.url() === firstUrl);

    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('CHAT_MESSAGE').filter({ hasText: 'this image' })).toHaveCount(
      1,
      {
        timeout: PANEL_TIMEOUT,
      },
    );

    const firstResponse = await firstResponsePromise;
    expect(firstResponse.status()).toBe(200);
    const firstBody = await firstResponse.body();
    expect(firstBody.length).toBe(first.bytes.length);

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'this image ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: firstUrl },
      { tag: 'span', text: ' vs this image ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: secondUrl },
    ]);

    const strippedText = await images.readBubbleText({ page });
    expect(strippedText).toBe('this image  vs this image ');

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(16);
    await expect.poll(async () => images.readNaturalWidth({ page, index: 1 })).toBe(24);

    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(0);
    expect(consoleErrors.getErrors()).toStrictEqual([]);
  });

  test('VALID: {message "A" + image + "B"} => the bubble child order is exactly [text A, img, text B]', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Images Order Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'order.png',
      widthPx: 12,
      heightPx: 12,
      seed: 3,
    });
    const content = images.buildTokenLine({
      segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
    });

    const sessionId = `e2e-session-transcript-order-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const expectedUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }),
    );

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE')).toHaveCount(1, { timeout: PANEL_TIMEOUT });

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'A', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: expectedUrl },
      { tag: 'span', text: 'B', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
  });

  test('VALID: {message with an image token followed by the real images trailer} => the trailer is invisible while the image still renders', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Images Trailer Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'trailer.png',
      widthPx: 10,
      heightPx: 10,
      seed: 4,
    });
    const preSentinel = images.buildTokenLine({
      segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
    });
    const content = images.appendImagesPromptTrailer({ content: String(preSentinel) });

    const sessionId = `e2e-session-transcript-trailer-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, { timeout: PANEL_TIMEOUT });

    // parseTranscriptSegmentsTransformer cuts the content at the sentinel's own index, so the
    // pre-sentinel text is everything BEFORE "<!-- dungeonmaster:images -->" byte-for-byte — the two
    // newlines appendImagesPromptTrailer inserts between the composed content and the sentinel are
    // part of that pre-sentinel text, not stripped.
    const bubbleText = await images.readBubbleText({ page });
    expect(bubbleText).toBe('AB\n\n');

    await expect(page.getByText(String(images.getPromptInstructionText()))).toHaveCount(0);
  });
});
