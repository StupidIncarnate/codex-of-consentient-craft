import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { SimpleTextResponseStub } from '@dungeonmaster/shared/contracts/claude-queue-response/claude-queue-response.stub';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';
import { composerSendHarness } from '../../../test/harnesses/composer-send/composer-send.harness';

const GUILD_PATH = '/tmp/dm-e2e-chat-composer-mount-regressions';
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest chat box — still owns its draft and its Enter-to-send after mounting the shared composer', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    // A one-shot clear against an already-loaded origin, with NO init script left registered: an
    // init script would re-fire on the reload below and wipe the very draft that test restores.
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test("VALID: {type 'half a sentence' into CHAT_INPUT, page reload} => CHAT_INPUT textContent is exactly 'half a sentence'", async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Chat Mount Regression Draft Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-chat-mount-draft-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'Chat Mount Regression Draft Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: questId }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000002001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: QuestIdStub({ value: questId }) });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    await page.keyboard.type('half a sentence');
    // Precondition: the draft store really holds the text going INTO the reload, so a failure below
    // is the restore path's own, not a draft that was never written.
    expect(await composer.readDraftText()).toBe('half a sentence');

    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    // chat-draft-still-survives-a-reload: the chat box's own mount restores its text draft.
    expect(await composer.readComposerTextContent()).toBe('half a sentence');
  });

  test("VALID: {type 'ship it' into CHAT_INPUT, press Enter} => exactly one POST to /api/quests/<questId>/chat carries message 'ship it' and answers 200, and CHAT_INPUT textContent is ''", async ({
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
      name: 'Chat Mount Regression Enter Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-chat-mount-enter-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId,
      title: 'Chat Mount Regression Enter Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: questId }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000002002',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId: QuestIdStub({ value: questId }) });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

    await composer.focusComposer();
    await page.keyboard.type('ship it');

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

    // chat-box-enter-still-sends: exactly one POST, carrying the typed message, answered 200.
    expect(send.readPostCount()).toBe(1);
    expect(sentRequest.postDataJSON()).toStrictEqual({ message: 'ship it' });
    expect(response.status()).toBe(HTTP_OK);

    expect(await composer.readComposerTextContent()).toBe('');
  });
});
