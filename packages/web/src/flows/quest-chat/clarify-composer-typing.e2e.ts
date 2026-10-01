import { AssistantAskUserQuestionStreamLineStub } from '@dungeonmaster/shared/contracts/assistant-stream-line/assistant-stream-line.stub';
import { ClarificationResponseStub } from '@dungeonmaster/shared/contracts/claude-queue-response/claude-queue-response.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { ResultStreamLineStub } from '@dungeonmaster/shared/contracts/result-stream-line/result-stream-line.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { SystemInitStreamLineStub } from '@dungeonmaster/shared/contracts/system-init-stream-line/system-init-stream-line.stub';
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-clarify-composer-typing';
const PANEL_TIMEOUT = 10_000;
const NO_CLARIFY_POST_WINDOW = 1_500;
const IMAGE_SIZE_PX = 20;
const DRAFT_DURABLE_TIMEOUT = 10_000;
const OPTIONS_PER_QUESTION = 2;
const TOOL_USE_ID = 'toolu_e2e_clarify_typing';

// Heights are read off the painted editor in a real browser, because jsdom has no layout engine.
// They are the values a real run measured, so a drift in the editor's minHeight, maxHeight or
// box-sizing fails this file.
const EMPTY_EDITOR_HEIGHT_PX = 60;
const CAPPED_EDITOR_HEIGHT_PX = 200;
const WRAPPING_TEXT = 'abcdefghij '.repeat(18);
const OVERFLOWING_LINES = 'a\n'.repeat(14);
const TWO_MORE_LINES = 'a\na';

const QUESTIONS = [
  {
    question: 'Which database do you want to use?',
    header: 'Database Selection',
    options: [
      { label: 'PostgreSQL', description: 'Relational database' },
      { label: 'SQLite', description: 'File-based database' },
    ],
    multiSelect: false,
  },
  {
    question: 'Which cache do you want to use?',
    header: 'Cache Selection',
    options: [
      { label: 'Redis', description: 'In-memory store' },
      { label: 'Memcached', description: 'Plain key-value cache' },
    ],
    multiSelect: false,
  },
];

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Clarify panel — the answer box is the shared chat composer', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    // A one-shot clear against an already-loaded origin, never an init script: the draft test
    // reloads, and an init script would wipe the draft it just wrote.
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {two multiSelect:false questions} => CLARIFY_COMPOSER sits below the option cards on question 1 and question 2, CLARIFY_OTHER_BTN never exists, and typing keeps every option card on screen in a contenteditable div', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Clarify Typing Visible Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-clarify-typing-visible-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });
    const created = await quests.createQuest({
      guildId,
      title: 'Clarify Typing Visible Quest',
      userRequest: 'Build the feature',
    });
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: String(created.questId) }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-0000000000c1', role: 'chaoswhisperer', sessionId },
      ],
    });
    claudeMock.queueResponse({
      response: ClarificationResponseStub({
        sessionId,
        lines: [
          JSON.stringify(
            SystemInitStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) }),
          ),
          JSON.stringify(
            AssistantAskUserQuestionStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: TOOL_USE_ID,
                    name: 'mcp__dungeonmaster__ask-user-question',
                    input: { questions: QUESTIONS },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) })),
        ],
      }),
    });

    await nav.navigateToQuest({ urlSlug, questId: created.questId });
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');

    // composer-is-always-visible on question 1
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 1 of 2');
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toBeVisible();
    const composerTop1 = await page
      .getByTestId('CLARIFY_COMPOSER')
      .evaluate((element) => element.getBoundingClientRect().top);
    const lastOptionBottom1 = await page
      .getByTestId('CLARIFY_OPTION')
      .last()
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(composerTop1 >= lastOptionBottom1).toBe(true);

    // other-button-is-gone, and the tx-offer-today branch: text entry needs no "Other..." click
    await expect(page.getByTestId('CLARIFY_OTHER_BTN')).toHaveCount(0);

    // actual-single-line-other-box regression guard: typing leaves every option card in place and
    // the text box is the contenteditable div
    await page.getByTestId('CLARIFY_COMPOSER').click();
    await page.keyboard.type('my own answer');
    await expect(page.getByTestId('CLARIFY_OPTION')).toHaveCount(OPTIONS_PER_QUESTION);
    await expect(page.getByTestId('CLARIFY_OTHER_BTN')).toHaveCount(0);
    expect(await page.getByTestId('CLARIFY_COMPOSER').getAttribute('contenteditable')).toBe('true');
    expect(await page.getByTestId('CLARIFY_COMPOSER').evaluate((element) => element.tagName)).toBe(
      'DIV',
    );

    // composer-is-always-visible on question 2
    await page.getByTestId('CLARIFY_OPTION').first().click();
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toBeVisible();
    await expect(page.getByTestId('CLARIFY_OTHER_BTN')).toHaveCount(0);
    const composerTop2 = await page
      .getByTestId('CLARIFY_COMPOSER')
      .evaluate((element) => element.getBoundingClientRect().top);
    const lastOptionBottom2 = await page
      .getByTestId('CLARIFY_OPTION')
      .last()
      .evaluate((element) => element.getBoundingClientRect().bottom);
    expect(composerTop2 >= lastOptionBottom2).toBe(true);
  });

  test("VALID: {type 'first line', press Shift+Enter} => CLARIFY_COMPOSER text is 'first line' plus a newline, the counter still reads Question 1 of 2, and no clarify POST fires", async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Clarify Typing Newline Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-clarify-typing-newline-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });
    const created = await quests.createQuest({
      guildId,
      title: 'Clarify Typing Newline Quest',
      userRequest: 'Build the feature',
    });
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: String(created.questId) }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-0000000000c2', role: 'chaoswhisperer', sessionId },
      ],
    });
    claudeMock.queueResponse({
      response: ClarificationResponseStub({
        sessionId,
        lines: [
          JSON.stringify(
            SystemInitStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) }),
          ),
          JSON.stringify(
            AssistantAskUserQuestionStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: TOOL_USE_ID,
                    name: 'mcp__dungeonmaster__ask-user-question',
                    input: { questions: QUESTIONS },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) })),
        ],
      }),
    });

    await nav.navigateToQuest({ urlSlug, questId: created.questId });
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    const clarifyPostOutcome = page
      .waitForRequest(
        (clarifyReq) =>
          clarifyReq.method() === 'POST' &&
          clarifyReq.url().endsWith(`/api/quests/${String(created.questId)}/clarify`),
        { timeout: NO_CLARIFY_POST_WINDOW },
      )
      .then(
        () => 'posted',
        () => 'no post',
      );

    await page.getByTestId('CLARIFY_COMPOSER').click();
    await page.keyboard.type('first line');
    await page.keyboard.press('Shift+Enter');

    expect(
      await page.getByTestId('CLARIFY_COMPOSER').evaluate((element) => element.textContent),
    ).toBe('first line\n');
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 1 of 2');
    expect(await clarifyPostOutcome).toBe('no post');
  });

  test('VALID: {type text that wraps onto a third line} => CLARIFY_COMPOSER grows past its empty height and its scrollHeight equals its clientHeight', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Clarify Typing Grows Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-clarify-typing-grows-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });
    const created = await quests.createQuest({
      guildId,
      title: 'Clarify Typing Grows Quest',
      userRequest: 'Build the feature',
    });
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: String(created.questId) }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-0000000000c3', role: 'chaoswhisperer', sessionId },
      ],
    });
    claudeMock.queueResponse({
      response: ClarificationResponseStub({
        sessionId,
        lines: [
          JSON.stringify(
            SystemInitStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) }),
          ),
          JSON.stringify(
            AssistantAskUserQuestionStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: TOOL_USE_ID,
                    name: 'mcp__dungeonmaster__ask-user-question',
                    input: { questions: QUESTIONS },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) })),
        ],
      }),
    });

    await nav.navigateToQuest({ urlSlug, questId: created.questId });
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');

    const emptyHeight = await page
      .getByTestId('CLARIFY_COMPOSER')
      .evaluate((element) => Math.round(element.getBoundingClientRect().height));
    expect(emptyHeight).toBe(EMPTY_EDITOR_HEIGHT_PX);

    await page.getByTestId('CLARIFY_COMPOSER').click();
    await page.keyboard.insertText(WRAPPING_TEXT);

    const grown = await page.getByTestId('CLARIFY_COMPOSER').evaluate(
      (element, emptyHeightPx) => ({
        grewPastEmptyHeight: Math.round(element.getBoundingClientRect().height) > emptyHeightPx,
        hasInnerScrollbar: element.scrollHeight > element.clientHeight,
      }),
      EMPTY_EDITOR_HEIGHT_PX,
    );
    expect(grown).toStrictEqual({ grewPastEmptyHeight: true, hasInnerScrollbar: false });
  });

  test('EDGE: {type Shift+Enter lines past 200px} => CLARIFY_COMPOSER stops at the capped height, two more lines leave it unchanged, and it gains a vertical scrollbar', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Clarify Typing Cap Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-clarify-typing-cap-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });
    const created = await quests.createQuest({
      guildId,
      title: 'Clarify Typing Cap Quest',
      userRequest: 'Build the feature',
    });
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: String(created.questId) }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-0000000000c4', role: 'chaoswhisperer', sessionId },
      ],
    });
    claudeMock.queueResponse({
      response: ClarificationResponseStub({
        sessionId,
        lines: [
          JSON.stringify(
            SystemInitStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) }),
          ),
          JSON.stringify(
            AssistantAskUserQuestionStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: TOOL_USE_ID,
                    name: 'mcp__dungeonmaster__ask-user-question',
                    input: { questions: QUESTIONS },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) })),
        ],
      }),
    });

    await nav.navigateToQuest({ urlSlug, questId: created.questId });
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');

    // Shift held while typing '\n' presses Enter with shiftKey set, which is the newline path.
    await page.getByTestId('CLARIFY_COMPOSER').click();
    await page.keyboard.down('Shift');
    await page.keyboard.type(OVERFLOWING_LINES);
    await page.keyboard.up('Shift');

    const atCap = await page.getByTestId('CLARIFY_COMPOSER').evaluate((element) => ({
      height: Math.round(element.getBoundingClientRect().height),
      hasInnerScrollbar: element.scrollHeight > element.clientHeight,
    }));
    expect(atCap).toStrictEqual({ height: CAPPED_EDITOR_HEIGHT_PX, hasInnerScrollbar: true });

    await page.keyboard.down('Shift');
    await page.keyboard.type(TWO_MORE_LINES);
    await page.keyboard.up('Shift');

    const afterTwoMoreLines = await page.getByTestId('CLARIFY_COMPOSER').evaluate((element) => ({
      height: Math.round(element.getBoundingClientRect().height),
      hasInnerScrollbar: element.scrollHeight > element.clientHeight,
    }));
    expect(afterTwoMoreLines).toStrictEqual({
      height: CAPPED_EDITOR_HEIGHT_PX,
      hasInnerScrollbar: true,
    });
  });

  test("VALID: {quest chat draft 'half a sentence' plus one pasted image, reload with the panel still up} => CHAT_INPUT restores both while CLARIFY_COMPOSER is empty with no thumbnail", async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Clarify Typing Draft Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-clarify-typing-draft-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });
    const created = await quests.createQuest({
      guildId,
      title: 'Clarify Typing Draft Quest',
      userRequest: 'Build the feature',
    });
    await quests.writeQuestFile({
      questId: QuestIdStub({ value: String(created.questId) }),
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-0000000000c5', role: 'chaoswhisperer', sessionId },
      ],
    });
    claudeMock.queueResponse({
      response: ClarificationResponseStub({
        sessionId,
        lines: [
          JSON.stringify(
            SystemInitStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) }),
          ),
          JSON.stringify(
            AssistantAskUserQuestionStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'tool_use',
                    id: TOOL_USE_ID,
                    name: 'mcp__dungeonmaster__ask-user-question',
                    input: { questions: QUESTIONS },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: SessionIdStub({ value: sessionId }) })),
        ],
      }),
    });

    await nav.navigateToQuest({ urlSlug, questId: created.questId });
    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    await page.keyboard.type('half a sentence');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    // The thumbnail lands in the DOM several event-loop hops before its IndexedDB record commits,
    // and a reload before that aborts the write. Poll the real store, never a fixed wait.
    const pastedAttachmentIds = await composer.readThumbnailAttachmentIds();
    await expect
      .poll(async () => composer.readDraftImageAttachmentIds(), { timeout: DRAFT_DURABLE_TIMEOUT })
      .toStrictEqual(pastedAttachmentIds);

    await page.reload();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toBeVisible();

    // The drafts really were saved: CHAT_INPUT restored them.
    await expect(page.getByTestId('CHAT_INPUT').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerTextContent()).toBe('half a sentence');

    // And the clarify composer restored none of them.
    expect(
      await page.getByTestId('CLARIFY_COMPOSER').evaluate((element) => element.textContent),
    ).toBe('');
    expect(
      await page
        .getByTestId('CLARIFY_COMPOSER')
        .evaluate((element) => element.querySelectorAll('img').length),
    ).toBe(0);
  });
});
