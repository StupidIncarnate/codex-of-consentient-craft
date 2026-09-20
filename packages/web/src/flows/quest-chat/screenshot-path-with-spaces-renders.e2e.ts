import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { composerSendHarness } from '../../../test/harnesses/composer-send/composer-send.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-screenshot-path-spaces-transcript';
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;
const SEED_WIDTH_PX = 16;
const SEED_HEIGHT_PX = 16;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: sessionHarness({ guildPath: GUILD_PATH }), testObj: test });
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('A screenshot path whose filename holds spaces renders like any other pasted image', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
  });

  test('VALID: {a backslash-escaped screenshot path with spaces typed into the composer} => converts to a real image and the escaped path text is gone from the bubble', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const send = composerSendHarness({ page });

    // The exact macOS screenshot filename pastedImageStatics's own header names as the motivating
    // case — a bare run of characters cannot tell where this path ends and the next word begins,
    // which is why the composer message below backslash-escapes each space.
    const seeded = images.seedImageFile({
      fileName: 'Screenshot 2026-09-20 at 10.30.45 AM.png',
      widthPx: SEED_WIDTH_PX,
      heightPx: SEED_HEIGHT_PX,
      seed: 1,
    });
    const originalImagePath = String(seeded.imagePath);
    const escapedPath = originalImagePath.replaceAll(' ', '\\ ');

    const guild = await guilds.createGuild({
      name: 'Screenshot Path Spaces Escaped Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Deliberately NO `sessions.createSessionFile` call — see
    // screenshot-path-renders-in-transcript.e2e.ts's own comment on this exact shape: the fake CLI's
    // `--resume` path creates the session file fresh from this test's own turn, with no earlier
    // bubble ahead of it in DOM order for readBubbleChildren to misread.
    const sessionId = `e2e-screenshot-spaces-escaped-${Date.now()}`;

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Screenshot Path Spaces Escaped Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000f001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').click();
    await page.keyboard.type(`look ${escapedPath} ok`);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // reduce-with-no-initial-value throws on an empty array rather than typing as T | undefined —
    // the `.poll(...).toBe(1)` immediately above is what proves the array is non-empty first.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    const copiedImagePath = String(tokens.paths[0]);
    // Precondition: the server actually rewrote the escaped path into a token carrying a copied
    // path — proven here so a later failure below is about the UI render, never the conversion.
    expect(copiedImagePath.length > 0).toBe(true);

    // The server-rewritten prompt only reaches the browser through the session transcript on disk,
    // and subscribe-quest's replay already ran at navigate time — a reload is what delivers it.
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const expectedImageUrl = String(images.buildExpectedImageUrl({ imagePath: copiedImagePath }));

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'look ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: expectedImageUrl },
      { tag: 'span', text: ' ok', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
    // The full bubble text is 'look  ok' with no trace of the escaped path — a rewrite that left
    // the backslash-escaped spaces (or any fragment of the path) behind would fail this exact match.
    const bubbleText = await images.readBubbleText({ page });
    expect(bubbleText).toBe('look  ok');

    const naturalWidth = await images.readNaturalWidth({ page, index: 0 });
    expect(naturalWidth).toBe(SEED_WIDTH_PX);
  });

  test('VALID: {a double-quoted screenshot path with spaces typed into the composer} => converts to a real image and the quote characters are gone from the bubble', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const send = composerSendHarness({ page });

    // The GNOME screenshot filename pastedImageStatics's own header names alongside the macOS one —
    // also holds spaces, this time quoted rather than backslash-escaped by the composer message.
    const seeded = images.seedImageFile({
      fileName: 'Screenshot from 2026-09-20 12-00-00.png',
      widthPx: SEED_WIDTH_PX,
      heightPx: SEED_HEIGHT_PX,
      seed: 2,
    });
    const originalImagePath = String(seeded.imagePath);
    const quotedPath = `"${originalImagePath}"`;

    const guild = await guilds.createGuild({
      name: 'Screenshot Path Spaces Quoted Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-screenshot-spaces-quoted-${Date.now()}`;

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Screenshot Path Spaces Quoted Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000f002',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').click();
    await page.keyboard.type(`look ${quotedPath} ok`);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    const copiedImagePath = String(tokens.paths[0]);
    expect(copiedImagePath.length > 0).toBe(true);

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const expectedImageUrl = String(images.buildExpectedImageUrl({ imagePath: copiedImagePath }));

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'look ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: expectedImageUrl },
      { tag: 'span', text: ' ok', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
    // 'look  ok' with no quote characters anywhere — a rewrite that replaced only the inner path and
    // left the `"` marks orphaned around the token would leave 'look "" ok' or similar, failing this.
    const bubbleText = await images.readBubbleText({ page });
    expect(bubbleText).toBe('look  ok');

    const naturalWidth = await images.readNaturalWidth({ page, index: 0 });
    expect(naturalWidth).toBe(SEED_WIDTH_PX);
  });

  test('VALID: {a bare screenshot path with an uppercase .PNG extension typed into the composer} => converts to a real image that paints', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const send = composerSendHarness({ page });

    // No spaces in this filename — the case under test here is the extension's capitalisation, not
    // the quoting/escaping alternatives the two tests above already cover.
    const seeded = images.seedImageFile({
      fileName: 'UPPERCASE-EXTENSION-SCREENSHOT.PNG',
      widthPx: SEED_WIDTH_PX,
      heightPx: SEED_HEIGHT_PX,
      seed: 3,
    });
    const originalImagePath = String(seeded.imagePath);

    const guild = await guilds.createGuild({
      name: 'Screenshot Path Uppercase Extension Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-screenshot-spaces-uppercase-${Date.now()}`;

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Screenshot Path Uppercase Extension Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000f003',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').click();
    await page.keyboard.type(`look ${originalImagePath} ok`);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    const copiedImagePath = String(tokens.paths[0]);
    expect(copiedImagePath.length > 0).toBe(true);

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const expectedImageUrl = String(images.buildExpectedImageUrl({ imagePath: copiedImagePath }));

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'look ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: expectedImageUrl },
      { tag: 'span', text: ' ok', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
    const bubbleText = await images.readBubbleText({ page });
    expect(bubbleText).toBe('look  ok');

    const naturalWidth = await images.readNaturalWidth({ page, index: 0 });
    expect(naturalWidth).toBe(SEED_WIDTH_PX);
  });

  test('EDGE: {a bare screenshot path holding real unescaped spaces typed into the composer} => is not converted and survives in the bubble as text, character for character', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const send = composerSendHarness({ page });

    // Same macOS-shaped filename as the escaped case above, typed BARE this time — a run of
    // characters cannot tell where this path ends and " ok" begins without asking the filesystem,
    // which localImagePathsFindTransformer deliberately never does. This is the limit the fix draws,
    // not an oversight.
    const seeded = images.seedImageFile({
      fileName: 'Screenshot 2026-09-20 at 11.45.00 AM.png',
      widthPx: SEED_WIDTH_PX,
      heightPx: SEED_HEIGHT_PX,
      seed: 4,
    });
    const originalImagePath = String(seeded.imagePath);
    const typedMessage = `look ${originalImagePath} ok`;

    const guild = await guilds.createGuild({
      name: 'Screenshot Path Bare Unescaped Spaces Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-screenshot-spaces-bare-${Date.now()}`;

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Screenshot Path Bare Unescaped Spaces Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000f004',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').click();
    await page.keyboard.type(typedMessage);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    // Precondition: the server found NO local image path to rewrite — the raw message reached the
    // agent completely unchanged, proving the "no conversion happened" claim server-side, before the
    // UI assertions below check the same thing in the transcript.
    expect(tokens).toStrictEqual({ ordinals: [], paths: [] });

    // The server-rewritten (here: untouched) prompt only reaches the browser through the session
    // transcript on disk — a reload is what proves the raw text survived the full round trip rather
    // than merely echoing back the optimistic bubble this browser rendered before the POST returned.
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: typedMessage, testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
    const bubbleText = await images.readBubbleText({ page });
    expect(bubbleText).toBe(typedMessage);

    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(0);
  });
});
