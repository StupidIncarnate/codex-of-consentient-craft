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

const GUILD_PATH = '/tmp/dm-e2e-send-text-only-newline';
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Composer send — text-only sends and Shift+Enter newline', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {type text, Shift+Enter} => a real Shift+Enter with live text sends zero requests, and a later plain Enter then fires exactly one POST answered 200', async ({
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
      name: 'Send Text Only Newline Shift Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-text-only-newline-shift-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Text Only Newline Shift Quest',
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
          id: 'e2e00000-0000-4000-8000-000000001001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

    await composer.focusComposer();
    await page.keyboard.type('one');
    await page.keyboard.press('Shift+Enter');

    // send-text-only-and-newline:branch:shift-yes — the branch was actually taken: with text
    // already in the composer, a real Shift+Enter leaves the text content carrying a '\n' (not
    // stripped, not doubled) AND issues zero POSTs.
    expect(await composer.readComposerTextContent()).toBe('one\n');
    expect(send.readPostCount()).toBe(0);

    // The positive half of check-shift-enter-sends-nothing: a real plain Enter right after proves
    // the recorder is alive and the composer is still sendable, so the 0 above is not a broken
    // listener passing vacuously.
    const requestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const responsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    await requestPromise;
    const response = await responsePromise;

    expect(send.readPostCount()).toBe(1);
    expect(response.status()).toBe(HTTP_OK);
  });

  test('VALID: {type one, then Shift+Enter} => the composer content is exactly one plus a single newline character', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Send Text Only Newline Adds Newline Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-text-only-newline-adds-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Text Only Newline Adds Newline Quest',
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
          id: 'e2e00000-0000-4000-8000-000000001004',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    await page.keyboard.type('one');
    await page.keyboard.press('Shift+Enter');

    // send-text-only-and-newline:observable:check-shift-enter-adds-newline — the exact text a real
    // Shift+Enter leaves behind: 'one' followed by exactly one '\n'. Nothing is typed after the
    // Shift+Enter in this test — typing more text after an end-of-content Shift+Enter is a separate,
    // real product defect recorded as its own observable elsewhere, not proven or fixed here.
    expect(await composer.readComposerTextContent()).toBe('one\n');
  });

  test('VALID: {ArrowLeft twice then Shift+Enter} => the newline inserts AT THE CARET, the draft carries it, nothing sends yet, and continued typing plus a later plain Enter sends the whole multi-line text in one POST', async ({
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
      name: 'Send Text Only Newline Caret Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-text-only-newline-caret-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Text Only Newline Caret Quest',
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
          id: 'e2e00000-0000-4000-8000-000000001002',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

    await composer.focusComposer();
    await page.keyboard.type('abcd');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Shift+Enter');

    // send-text-only-and-newline:terminal:insert-newline — the newline lands AT THE CARET (between
    // 'ab' and 'cd'), not appended at the end of whatever the composer held.
    expect(await composer.readComposerTextContent()).toBe('ab\ncd');
    // Side-effect half of the same unit: the draft store carries the same string — the keystroke
    // was not silently consumed.
    expect(await composer.readDraftText()).toBe('ab\ncd');
    expect(send.readPostCount()).toBe(0);
    await expect(page.getByTestId('CHAT_INPUT_UPLOAD_PROGRESS')).toHaveCount(0);

    // send-text-only-and-newline:branch:newline-back — keep typing from the caret the insert left
    // behind (immediately after the '\n', before 'cd'), then loop back to send-pressed.
    await page.keyboard.type('X');

    const requestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const responsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const sentRequest = await requestPromise;
    await responsePromise;

    expect(send.readPostCount()).toBe(1);
    // The newline the previous state inserted really did survive into the POST body, still there,
    // still exactly one '\n' — and with no images key, since this composer never held a thumbnail.
    expect(sentRequest.postDataJSON()).toStrictEqual({ message: 'ab\nXcd' });
  });

  test('VALID: {composer holds text only, zero thumbnails, plain Enter} => the POST body carries no images key, the response is 200 with a real chatProcessId, and no upload bar or images directory ever appears', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Send Text Only Newline Plain Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-text-only-newline-plain-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Text Only Newline Plain Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    const questFilePath = String(created.filePath);
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath,
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000001003',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    // Registered BEFORE the navigation that lands on the composer page — recordComposerSendStates
    // installs via page.addInitScript, which only covers navigations that happen after it is called.
    await send.recordComposerSendStates();

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

    // send-text-only-and-newline:branch:no-images — the empty state really was hit before the send,
    // not assumed.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);

    await composer.focusComposer();
    await page.keyboard.type('no pictures here');

    const requestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const responsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const sentRequest = await requestPromise;
    const response = await responsePromise;

    // send-text-only-and-newline:observable:check-text-only-body-has-no-images-key — the WHOLE
    // body, not just the key's absence, so any extra key at all fails here.
    expect(sentRequest.postDataJSON()).toStrictEqual({ message: 'no pictures here' });

    expect(response.status()).toBe(HTTP_OK);
    const body = await response.json();
    expect(String(body.chatProcessId)).toMatch(/^\S+$/u);

    // send-text-only-and-newline:terminal:send-text-only — composer clears, draft clears, no stuck
    // spinner.
    expect(await composer.readComposerTextContent()).toBe('');
    expect(await composer.readDraftText()).toBe(null);
    await expect(page.getByTestId('CHAT_INPUT_UPLOAD_PROGRESS')).toHaveCount(0);

    const states = await send.readComposerSendStates();
    // Proves the recorder actually observed the send's lock/unlock transition (not an empty or
    // dead recorder), so the "never true" check right after does not pass vacuously.
    expect(states.length > 1).toBe(true);
    expect(states.some((entry) => entry.barPresent === true)).toBe(false);

    // A text-only send must never create the quest's images directory.
    const imagesDir = await send.readQuestImagesDir({ questFilePath });
    expect(imagesDir.exists).toBe(false);
  });
});
