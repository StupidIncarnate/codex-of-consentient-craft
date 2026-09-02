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
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';
import { composerSendHarness } from '../../../test/harnesses/composer-send/composer-send.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';

const GUILD_PATH = '/tmp/dm-e2e-send-images-reach-agent';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;

// The exact trailer imagePromptTrailerTransformer appends to a prompt carrying at least one
// rewritten image token. Restated rather than imported — a spec may not import orchestrator
// statics as values, and this is pastedImageStatics.promptSentinel + '\n' + .promptInstruction
// verbatim, joined the same way the transformer joins them — so a drift there must fail this
// spec's assertions rather than silently follow it.
const TRAILER_SUFFIX =
  '\n\n<!-- dungeonmaster:images -->\nRead every image referenced above before answering.';

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Composer send — images reach the agent', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {one image-carrying send through the composer} => the spawn branch fires exactly once and its prompt ends with the read-the-images trailer', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });

    const guild = await guilds.createGuild({ name: 'Reach Agent Branch Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-branch-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Branch Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000a001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    // The recording happens inside the spawn the responder fires off in the background, so the
    // count is polled rather than assumed to already be settled the instant the HTTP response
    // (which does not wait on the spawn) resolves.
    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    expect(String(latest.prompt).endsWith(TRAILER_SUFFIX)).toBe(true);
  });

  test('VALID: {"A" + one image + "B", plain Enter} => the POST carries the bare placeholder while the spawned prompt carries the markdown token instead of it', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Reach Agent Forward Once Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-forward-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Forward Once Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000b001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');

    const chatRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatRequest = await chatRequestPromise;
    expect(chatRequest.postDataJSON().message).toBe('A[Pasted Image 1]B');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);

    // ordinals empty would mean the bare "[Pasted Image 1]" token (no leading "!") survived
    // un-substituted — readPromptImageTokens' pattern only matches the markdown "![Pasted Image
    // N](path)" form, so a still-bare token yields NO match at all rather than a wrong one. One
    // toStrictEqual for both halves so neither can pass while the other silently regresses.
    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    const tokenSummary = {
      ordinals: tokens.ordinals.map((value) => String(value)),
      pathCount: tokens.paths.length,
    };
    expect(tokenSummary).toStrictEqual({ ordinals: ['1'], pathCount: 1 });
  });

  test('VALID: {one image-carrying send} => the invocation prompt carries an absolute path under the quest images dir naming a real file', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Reach Agent Absolute Path Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-abspath-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Absolute Path Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000c001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

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
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    const prompt = String(latest.prompt);

    // The image write is inside the awaited chain the HTTP response comes from (persist happens
    // before orchestratorStartChatAdapter is even called), so it is already on disk by the time
    // chatResponsePromise resolves — no poll needed for this read, unlike the invocation above.
    const imagesDirSummary = await send.readQuestImagesDir({
      questFilePath: String(created.filePath),
    });

    const tokenSummary = send.readPromptImageTokens({ prompt });
    const tokenPath = String(tokenSummary.paths[0]);

    expect({
      isAbsolute: tokenPath.startsWith('/'),
      startsWithImagesDir: tokenPath.startsWith(String(imagesDirSummary.dirPath)),
      fileExists: send.fileExistsAt({ filePath: tokenPath }),
    }).toStrictEqual({ isAbsolute: true, startsWithImagesDir: true, fileExists: true });
  });

  test('VALID: {"A" + one thumbnail + "B", plain Enter} => the prompt first line is the tokenised message with the real written file absolute path in the parentheses', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Reach Agent Markdown Path Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-mdpath-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Markdown Path Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000d001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');

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
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);

    const imagesDirSummary = await send.readQuestImagesDir({
      questFilePath: String(created.filePath),
    });
    expect(imagesDirSummary.fileNames.length).toBe(1);
    const expectedFirstLine = `A![Pasted Image 1](${String(imagesDirSummary.dirPath)}/${String(
      imagesDirSummary.fileNames[0],
    )})B`;

    expect(String(latest.prompt).split('\n')[0]).toBe(expectedFirstLine);
  });

  test('VALID: {two images built from different seeds} => ordinal 2 token path holds the second image bytes and ordinal 1 holds the first, never swapped', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Reach Agent Nth Token Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-nth-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Nth Token Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000e001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    const expectedBase64First = String(dataUrl1).slice(String(dataUrl1).indexOf(',') + 1);
    const expectedBase64Second = String(dataUrl2).slice(String(dataUrl2).indexOf(',') + 1);

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
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);

    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    const ordinal1Path = String(tokens.paths[tokens.ordinals.indexOf('1')]);
    const ordinal2Path = String(tokens.paths[tokens.ordinals.indexOf('2')]);

    // Both mappings in ONE toStrictEqual so a swap (ordinal 2 resolving to image 1's bytes) fails
    // the assertion rather than one half quietly passing while the other is wrong.
    expect({
      ordinal1Base64: send.readImageFileBase64({ filePath: ordinal1Path }),
      ordinal2Base64: send.readImageFileBase64({ filePath: ordinal2Path }),
    }).toStrictEqual({
      ordinal1Base64: expectedBase64First,
      ordinal2Base64: expectedBase64Second,
    });
  });

  test('VALID: {image-carrying send then text-only send on the same quest} => only the image-carrying prompt gets the trailer, appended exactly once, and the text-only prompt gets none', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({ name: 'Reach Agent Trailer Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-trailer-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Trailer Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000fa01',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-1' }) });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-2' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const firstResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const firstResponse = await firstResponsePromise;
    expect(firstResponse.status()).toBe(HTTP_OK);
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // See the `latest` comment above: reduce-to-last is the noUncheckedIndexedAccess-safe read of
    // "the one invocation that has happened so far", proven non-empty by the poll immediately above.
    const firstInvocation = claudeMock
      .readInvocations()
      .reduce((_previous, invocation) => invocation);
    const firstPrompt = String(firstInvocation.prompt);
    expect({
      endsWithTrailer: firstPrompt.endsWith(TRAILER_SUFFIX),
      sentinelCount: send.countSentinelOccurrences({ prompt: firstPrompt }),
    }).toStrictEqual({ endsWithTrailer: true, sentinelCount: 1 });

    await composer.focusComposer();
    await page.keyboard.type('No images in this one');

    const secondResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const secondResponse = await secondResponsePromise;
    expect(secondResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(2);
    // See the `latest` comment above: reduce-to-last is the noUncheckedIndexedAccess-safe read of
    // "the newest of the 2 invocations", proven by the poll immediately above (`.toBe(2)`).
    const secondInvocation = claudeMock
      .readInvocations()
      .reduce((_previous, invocation) => invocation);
    const secondPrompt = String(secondInvocation.prompt);
    expect(send.countSentinelOccurrences({ prompt: secondPrompt })).toBe(0);
  });

  test('VALID: {one image-carrying send} => the spawned argv -p value carries the exact absolute path readQuestImagesDir lists for this quest', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({ name: 'Reach Agent Argv Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-argv-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent Argv Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000007001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    const imagesDirSummary = await send.readQuestImagesDir({
      questFilePath: String(created.filePath),
    });
    expect(imagesDirSummary.fileNames.length).toBe(1);
    const expectedPath = `${String(imagesDirSummary.dirPath)}/${String(imagesDirSummary.fileNames[0])}`;

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);

    const tokenSummary = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    // promptIsNotNull guards "no -p at all" — folded into the same object as the path match so
    // there is exactly one assertion covering both halves of this unit's claim.
    expect({
      promptIsNotNull: latest.prompt !== null,
      matchedPath: String(tokenSummary.paths[0]),
    }).toStrictEqual({ promptIsNotNull: true, matchedPath: expectedPath });
  });

  test('VALID: {follow-up tab, one pasted image, plain Enter} => the follow-up route answers 200 and the newest invocation -p carries the absolute path of the file that send wrote', async ({
    page,
    request,
  }) => {
    test.slow();

    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const sessionId = `e2e-reach-agent-followup-${Date.now()}`;
    // The transcript file has to exist before the tail attaches — it tails from `end`.
    followup.seedTavernkeeperSession({
      sessionId,
      turns: [
        {
          role: 'assistant',
          text: 'Earlier: the ward run came back green before the quest stopped.',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    // Resumed rather than fresh: the seeded tavernkeeper item already carries this sessionId, so
    // the followup route spawns with `--resume <sessionId>` and hits the same bare-message-plus-
    // trailer identity pipeline as a resumed main chat message (chatPromptBuildTransformer's
    // `if (sessionId)` branch), matching every other test in this file.
    const seeded = await followup.seedAndOpen({
      guildName: 'Reach Agent Followup Guild',
      status: 'blocked',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000008a01',
          role: 'codeweaver',
          status: 'complete',
        },
        {
          id: 'e2e00000-0000-4000-8000-000000008a02',
          role: 'tavernkeeper',
          status: 'complete',
          sessionId,
        },
      ],
    });
    const questId = String(seeded.questId);

    await followup.pressFollowup();

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    // Scoped inside the FOLLOW-UP tab's own CHAT_PANEL rather than an unscoped CHAT_INPUT_THUMBNAIL
    // read — the execution view can mount more than one CHAT_INPUT/thumbnail region at once.
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const followupResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/followup`),
    );
    await page.keyboard.press('Enter');
    const followupResponse = await followupResponsePromise;
    expect(followupResponse.status()).toBe(HTTP_OK);

    const imagesDirSummary = await send.readQuestImagesDir({
      questFilePath: String(seeded.questFilePath),
    });
    expect(imagesDirSummary.fileNames.length).toBe(1);
    const expectedPath = `${String(imagesDirSummary.dirPath)}/${String(imagesDirSummary.fileNames[0])}`;

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);

    const tokenSummary = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    expect({
      promptIsNotNull: latest.prompt !== null,
      matchedPath: String(tokenSummary.paths[0]),
    }).toStrictEqual({ promptIsNotNull: true, matchedPath: expectedPath });
  });

  test('VALID: {follow-up tab, two images built from different seeds with text around them, plain Enter} => the followup POST body toStrictEqual the tokenised message and the two images in paste order, and the response is 200 with a real chatProcessId', async ({
    page,
    request,
  }) => {
    test.slow();

    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    const composer = composerPasteHarness({ page });

    const sessionId = `e2e-reach-agent-followup-body-${Date.now()}`;
    // The transcript file has to exist before the tail attaches — it tails from `end`.
    followup.seedTavernkeeperSession({
      sessionId,
      turns: [
        {
          role: 'assistant',
          text: 'Earlier: the ward run came back green before the quest stopped.',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    // Resumed rather than fresh: the seeded tavernkeeper item already carries this sessionId, so
    // the followup route spawns with `--resume <sessionId>`, matching every other follow-up test
    // in this file.
    const seeded = await followup.seedAndOpen({
      guildName: 'Reach Agent Followup Body Guild',
      status: 'blocked',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000008b01',
          role: 'codeweaver',
          status: 'complete',
        },
        {
          id: 'e2e00000-0000-4000-8000-000000008b02',
          role: 'tavernkeeper',
          status: 'complete',
          sessionId,
        },
      ],
    });
    const questId = String(seeded.questId);

    await followup.pressFollowup();

    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    // Scoped inside the FOLLOW-UP tab's own CHAT_PANEL rather than an unscoped CHAT_INPUT_THUMBNAIL
    // read — the execution view can mount more than one CHAT_INPUT/thumbnail region at once.
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);
    await page.keyboard.type('C');

    // Built from two DIFFERENT seeds, so the two entries' bytes genuinely differ — that is what
    // makes a swapped pair fail rather than pass by coincidence.
    const expectedBase64First = String(dataUrl1).slice(String(dataUrl1).indexOf(',') + 1);
    const expectedBase64Second = String(dataUrl2).slice(String(dataUrl2).indexOf(',') + 1);

    const followupRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/followup`),
    );
    const followupResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/followup`),
    );
    await page.keyboard.press('Enter');
    const followupRequest = await followupRequestPromise;

    expect({
      method: followupRequest.method(),
      urlEndsWithFollowupRoute: followupRequest.url().endsWith(`/api/quests/${questId}/followup`),
    }).toStrictEqual({ method: 'POST', urlEndsWithFollowupRoute: true });

    // ONE whole-object assertion, so an extra key (a stray `questType`), a dropped `mediaType`, or a
    // swapped pair all fail here — mirrors send-images-chat-route.e2e.ts's chat-route body assertion.
    expect(followupRequest.postDataJSON()).toStrictEqual({
      message: 'A[Pasted Image 1]B[Pasted Image 2]C',
      images: [
        { mediaType: 'image/png', dataBase64: expectedBase64First },
        { mediaType: 'image/png', dataBase64: expectedBase64Second },
      ],
    });

    const followupResponse = await followupResponsePromise;
    expect(followupResponse.status()).toBe(HTTP_OK);
    const followupBody = await followupResponse.json();
    expect(String(followupBody.chatProcessId)).toMatch(/^\S+$/u);
  });

  test('VALID: {two sequential image-carrying sends on the same quest} => the first send token path still resolves to its original file, byte-identical, after the second send lands', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Reach Agent First Token Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-reach-agent-first-token-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Reach Agent First Token Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000009001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-1' }) });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-2' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const expectedBase64First = String(dataUrl1).slice(String(dataUrl1).indexOf(',') + 1);

    const firstResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const firstResponse = await firstResponsePromise;
    expect(firstResponse.status()).toBe(HTTP_OK);
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // See the `latest` comment above: reduce-to-last is the noUncheckedIndexedAccess-safe read of
    // "the one invocation that has happened so far", proven non-empty by the poll immediately above.
    const firstInvocation = claudeMock
      .readInvocations()
      .reduce((_previous, invocation) => invocation);
    const firstTokens = send.readPromptImageTokens({ prompt: String(firstInvocation.prompt) });
    const firstTokenPath = String(firstTokens.paths[0]);

    await composer.focusComposer();
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const secondResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const secondResponse = await secondResponsePromise;
    expect(secondResponse.status()).toBe(HTTP_OK);

    const imagesDirSummary = await send.readQuestImagesDir({
      questFilePath: String(created.filePath),
    });

    // fileExistsAt/readImageFileBase64 folded into the same object as the count-only close, so the
    // "still resolves" claim and the "second send demonstrably happened" claim fail together rather
    // than one passing while the other silently regresses.
    expect({
      firstFileStillExists: send.fileExistsAt({ filePath: firstTokenPath }),
      firstFileBase64: send.readImageFileBase64({ filePath: firstTokenPath }),
      imagesDirFileCount: imagesDirSummary.fileNames.length,
    }).toStrictEqual({
      firstFileStillExists: true,
      firstFileBase64: expectedBase64First,
      imagesDirFileCount: 2,
    });
  });
});
