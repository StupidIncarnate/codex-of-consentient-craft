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

const OVER_CAP_WIDTH_PX = 6000;
const OVER_CAP_HEIGHT_PX = 4000;
const OVER_CAP_NOISE_BAND_ROWS = 700;

// Restated rather than imported: the RENDERED bound is chatComposerStatics.thumbnail's own knob,
// not derived from anything a paste or a reload computes — a drift there must fail this file
// rather than silently follow it. composer-paste-inserts-thumbnail.e2e.ts proves this same bound
// on the PASTE path; this file's own test proves it holds on the RESTORE path too, after a reload
// rebuilds the thumbnail from the persisted draft rather than from the live paste handler.
const THUMBNAIL_MAX_HEIGHT_PX = 60;
// object-fit: contain scales the 2000x1333 downscaled attachment (aspect ratio ~1.5) inside a
// 120x60 box (aspect ratio 2.0) — narrower-than-box, so height binds at exactly the cap and width
// follows the same ratio: round(2000 * 60 / 1333) = 90, comfortably inside the 120px width cap.
const THUMBNAIL_EXPECTED_RENDERED_WIDTH_PX = 90;

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

  // PAINTED GEOMETRY — jsdom has no layout engine and reports 0 for every box, so this is provable
  // only in a real browser. composer-paste-inserts-thumbnail.e2e.ts proves the PASTE path bounds a
  // large image's rendered thumbnail; this proves the RESTORE path (a page reload rebuilding the
  // <img> from the persisted draft, in dom-composer-write-adapter.ts) applies the SAME bound rather
  // than rendering the attachment at its own downscaled-but-still-huge intrinsic pixel size.
  test('EDGE: {paste a 6000x4000 PNG downscaled to 2000x1333, reload} => the RESTORED thumbnail paints at a bounded thumbnail size and SEND_BUTTON stays inside the viewport', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Reload Bounded Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-reload-bounded-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Reload Bounded Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000da',
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
    const dataUrl = await composer.buildOverCapImageDataUrl({
      widthPx: OVER_CAP_WIDTH_PX,
      heightPx: OVER_CAP_HEIGHT_PX,
      noiseBandRows: OVER_CAP_NOISE_BAND_ROWS,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    // The insert is the tail of an async handler (measure, then a PNG re-encode at the cap) — the
    // retrying locator is what waits for it, never a one-shot readThumbnailCount().
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    // #check-restored-thumbnail-render-size-bounded: painted at the thumbnail bound after reload,
    // not anywhere near the attachment's own 2000x1333 decoded pixels.
    expect(await composer.readThumbnailRenderedSizes()).toStrictEqual([
      { width: THUMBNAIL_EXPECTED_RENDERED_WIDTH_PX, height: THUMBNAIL_MAX_HEIGHT_PX },
    ]);

    // #check-send-button-stays-onscreen: a real user reloading after pasting one large image must
    // not have to scroll to find SEND — its whole box has to sit within the viewport's own height.
    expect(await composer.readSendButtonFitsInViewport()).toBe(true);
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

// Defect 2: a database that already sits at the app's expected version but is missing the draft
// images store (corrupted state, or a decoy schema) must self-heal rather than fail silently
// forever. jsdom has no real IndexedDB, so onupgradeneeded's real "only fires on a version bump"
// semantics — the whole reason this bug can exist — are only provable in a real browser.
test.describe('Composer paste — a draft database missing its store heals itself', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {database exists at version 1 holding only a decoy store} => paste still writes a real draft record, the decoy store survives, and a reload restores the thumbnail', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Store Heals Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-draft-store-heals-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Store Heals Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000db',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const composer = composerPasteHarness({ page });
    // Seeded on THIS page (still on '/'), before the composer route ever loads — the app's own
    // adapters must never get a chance to create the real store first, or there is nothing left
    // for them to heal.
    await composer.seedDecoyDraftDatabase();
    expect(await composer.readDraftDatabaseStoreNames()).toStrictEqual(['decoy-store']);

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    // The DOM thumbnail appearing is NOT proof the store healed — defect 2's whole symptom is a
    // paste that looks like it worked while every persistence call fails silently underneath it.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const [attachmentId] = await composer.readThumbnailAttachmentIds();
    const expectedBase64 = String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);
    expect(await composer.readDraftImageRecords()).toStrictEqual([
      { attachmentId, mediaType: 'image/png', dataBase64: expectedBase64 },
    ]);

    // #check-heal-does-not-drop-existing-stores: the decoy store survives the heal — a destructive
    // delete-and-recreate of the whole database would lose it (and, in the ordinary case where the
    // real store already exists, would lose a user's genuine draft records too). objectStoreNames
    // is a DOMStringList, spec-guaranteed ascending order — 'decoy-store' sorts before
    // 'dungeonmaster-chat-draft-images' ('e' < 'u' at the first differing character), so this exact
    // order is not an assumption about insertion order.
    const storeNamesAfterHeal = await composer.readDraftDatabaseStoreNames();
    expect(storeNamesAfterHeal).toStrictEqual(['decoy-store', 'dungeonmaster-chat-draft-images']);

    // The healed store is durable, not an in-memory illusion for this one connection — a reload
    // restores the thumbnail exactly as the ordinary (never-broken) reload path does above.
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
  });
});
