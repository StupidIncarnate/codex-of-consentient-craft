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

const GUILD_PATH = '/tmp/dm-e2e-composer-paste-draft-reload';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Composer paste — draft persists across reload and restores into a send', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    // Deliberately NOT composerPasteHarness's own `beforeEach` — that registers its clear via
    // `page.addInitScript`, which re-fires on EVERY future navigation of this same `page`, including
    // this file's own `page.reload()` calls. That would wipe the very draft a reload test just wrote,
    // before the reloaded document's restore ever runs. A one-shot clear against an already-loaded
    // origin, with NO init script left registered, is what lets a later reload observe real state.
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {thumbnail-in-composer, page reload} => composer restores exactly 1 thumbnail and text "AB"; with the draft stores cleared, a reload holds exactly 0 thumbnails', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Draft Reload State Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-state-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload State Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d1',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
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

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerTextContent()).toBe('AB');

    // Control: with the draft stores cleared, the SAME reload holds zero thumbnails — proving the
    // restore above did real work rather than the composer starting non-empty for some other reason.
    await composer.clearDraftStorage();
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
  });

  test('VALID: {draft restored after reload} => pressing Enter POSTs to /api/quests/<questId>/chat with images.length exactly 1', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Draft Reload Send Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-send-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Send Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d2',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await composer.focusComposer();
    const chatRequestPromise = page.waitForRequest(
      (chatReq) =>
        chatReq.method() === 'POST' && chatReq.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');

    const chatRequest = await chatRequestPromise;
    expect(chatRequest.postDataJSON().images.length).toBe(1);
  });

  test("VALID: {type 'A', paste one image, type 'B'} => localStorage key dungeonmaster-chat-draft holds exactly 'A[Pasted Image 1]B'", async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Draft Reload Tokens Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-tokens-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Tokens Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d3',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
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

    expect(await composer.readDraftText()).toBe('A[Pasted Image 1]B');
  });

  test("VALID: {paste one image} => the IndexedDB draft store holds one record whose bytes and mediaType equal the pasted image's", async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Draft Reload Bytes Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-bytes-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Bytes Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d4',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const [attachmentId] = await composer.readThumbnailAttachmentIds();
    const expectedBase64 = String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);

    expect(await composer.readDraftImageRecords()).toStrictEqual([
      { attachmentId, mediaType: 'image/png', dataBase64: expectedBase64 },
    ]);
  });

  test('VALID: {3 byte-distinct images pasted with typed text between} => the IndexedDB draft store holds exactly 3 records, one per attachmentId named in the text, in order', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Draft Reload Count Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-count-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Count Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d5',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);
    await page.keyboard.type('C');
    const dataUrl3 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 3,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl3) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(3);

    expect(await composer.readDraftText()).toBe(
      'A[Pasted Image 1]B[Pasted Image 2]C[Pasted Image 3]',
    );

    const thumbnailAttachmentIds = await composer.readThumbnailAttachmentIds();
    expect(await composer.readDraftImageAttachmentIds()).toStrictEqual(thumbnailAttachmentIds);
  });

  test('VALID: {"A" + thumbnail + "B", page reload} => the composer\'s child order is exactly text "A", IMG, text "B"', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Draft Reload Order Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-order-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Order Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d6',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
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

    const [srcBeforeReload] = await composer.readThumbnailSrcs();

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    expect(await composer.readComposerChildSummaries()).toStrictEqual([
      { kind: 'text', text: 'A' },
      { kind: 'image', src: srcBeforeReload },
      { kind: 'text', text: 'B' },
    ]);
  });

  test("VALID: {thumbnail restored after reload} => its img reports naturalWidth exactly the source image's width", async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Reload Renders Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-renders-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Renders Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d7',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');

    const [naturalWidth] = await composer.readThumbnailNaturalWidths();
    expect(naturalWidth).toBe(IMAGE_SIZE_PX);
  });

  test("VALID: {restored draft, type 'z' at the end, then Backspace} => the draft reads S + 'z', then reads S again", async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Reload Serialize Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-serialize-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Serialize Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d8',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
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

    const draftBeforeReload = await composer.readDraftText();

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await composer.focusComposer();
    await page.keyboard.press('End');
    await page.keyboard.type('z');
    expect(await composer.readDraftText()).toBe(`${String(draftBeforeReload)}z`);

    await page.keyboard.press('Backspace');
    expect(await composer.readDraftText()).toBe(draftBeforeReload);
  });

  test('VALID: {restored draft, press Enter} => POST images toStrictEqual [{mediaType, dataBase64}] of the pasted image, and the response comes back 200 with a real chatProcessId', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Reload Sends Bytes Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-sends-bytes-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Sends Bytes Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000d9',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const expectedBase64 = String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await composer.focusComposer();
    const chatRequestPromise = page.waitForRequest(
      (chatReq) =>
        chatReq.method() === 'POST' && chatReq.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const chatResponsePromise = page.waitForResponse(
      (chatRes) =>
        chatRes.request().method() === 'POST' &&
        chatRes.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');

    const chatRequest = await chatRequestPromise;
    expect(chatRequest.postDataJSON().images).toStrictEqual([
      { mediaType: 'image/png', dataBase64: expectedBase64 },
    ]);

    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);
    const chatBody = await chatResponse.json();
    expect(String(chatBody.chatProcessId)).toMatch(/^\S+$/u);
  });

  test('VALID: {quest A sends 2 images without reloading; quest B pastes the same 2, reloads, then sends} => both quests write exactly 2 non-empty files to their images directory', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Reload Writes Files Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const composer = composerPasteHarness({ page });

    // Quest A — the baseline: paste 2 byte-distinct images and send WITHOUT ever reloading.
    const sessionIdA = `e2e-draft-reload-writes-a-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdA, userMessage: 'Build feature' });
    const createdA = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Writes A Quest',
      userRequest: 'Build feature',
    });
    const questIdA = String(createdA.questId);
    quests.writeQuestFile({
      questId: questIdA,
      questFolder: String(createdA.questFolder),
      questFilePath: String(createdA.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000e1',
          role: 'chaoswhisperer',
          sessionId: sessionIdA,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId: sessionIdA, text: 'ack a' }),
    });

    await nav.navigateToQuest({ urlSlug, questId: questIdA });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrlA1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const dataUrlA2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    const chatResponsePromiseA = page.waitForResponse(
      (chatRes) =>
        chatRes.request().method() === 'POST' &&
        chatRes.url().endsWith(`/api/quests/${questIdA}/chat`),
    );
    await page.keyboard.press('Enter');
    await chatResponsePromiseA;

    const byteLengthsA = await composer.readQuestImageByteLengths({
      questFilePath: String(createdA.filePath),
    });
    expect(byteLengthsA.length).toBe(2);
    expect(Math.min(...byteLengthsA.map(Number))).toBeGreaterThan(0);

    // Quest B — paste the SAME two images, reload, wait for the restore, THEN send.
    const sessionIdB = `e2e-draft-reload-writes-b-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdB, userMessage: 'Build feature' });
    const createdB = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Writes B Quest',
      userRequest: 'Build feature',
    });
    const questIdB = String(createdB.questId);
    quests.writeQuestFile({
      questId: questIdB,
      questFolder: String(createdB.questFolder),
      questFilePath: String(createdB.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000e2',
          role: 'chaoswhisperer',
          sessionId: sessionIdB,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId: sessionIdB, text: 'ack b' }),
    });

    await nav.navigateToQuest({ urlSlug, questId: questIdB });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrlB1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const dataUrlB2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    await composer.focusComposer();
    const chatResponsePromiseB = page.waitForResponse(
      (chatRes) =>
        chatRes.request().method() === 'POST' &&
        chatRes.url().endsWith(`/api/quests/${questIdB}/chat`),
    );
    await page.keyboard.press('Enter');
    await chatResponsePromiseB;

    const byteLengthsB = await composer.readQuestImageByteLengths({
      questFilePath: String(createdB.filePath),
    });
    expect(byteLengthsB.length).toBe(2);
    expect(Math.min(...byteLengthsB.map(Number))).toBeGreaterThan(0);
  });
});
