import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import {
  ClarificationResponseStub,
  SimpleTextResponseStub,
} from '@dungeonmaster/shared/contracts/claude-queue-response/claude-queue-response.stub';
import { SystemInitStreamLineStub } from '@dungeonmaster/shared/contracts/system-init-stream-line/system-init-stream-line.stub';
import { ResultStreamLineStub } from '@dungeonmaster/shared/contracts/result-stream-line/result-stream-line.stub';
import { AssistantAskUserQuestionStreamLineStub } from '@dungeonmaster/shared/contracts/assistant-stream-line/assistant-stream-line.stub';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-clarify-composer-submit';
const PANEL_TIMEOUT = 10_000;
const CHAT_TIMEOUT = 10_000;
const HTTP_OK = 200;
const SESSION_ID = 'e2e-session-clarify-composer-submit';
const CONTINUATION_TEXT = 'Thanks, carrying on with your answers';
const TYPED_ANSWER = 'my own answer';

const QUESTION_ONE = {
  question: 'Which flavour should the feature have?',
  header: 'Flavour',
  options: [
    { label: 'Alpha', description: 'The first flavour' },
    { label: 'Beta', description: 'The second flavour' },
  ],
  multiSelect: false,
};
const QUESTION_TWO = {
  question: 'Which colour should the feature wear?',
  header: 'Colour',
  options: [
    { label: 'Gamma', description: 'The first colour' },
    { label: 'Delta', description: 'The second colour' },
  ],
  multiSelect: false,
};

const TWO_QUESTION_RESPONSE = ClarificationResponseStub({
  sessionId: SESSION_ID,
  lines: [
    JSON.stringify(SystemInitStreamLineStub({ session_id: SESSION_ID })),
    JSON.stringify(
      AssistantAskUserQuestionStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01ClarifyComposerSubmit',
              name: 'mcp__dungeonmaster__ask-user-question',
              input: { questions: [QUESTION_ONE, QUESTION_TWO] },
            },
          ],
        },
      }),
    ),
    JSON.stringify(ResultStreamLineStub({ session_id: SESSION_ID })),
  ],
});

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Clarify panel — the shared composer submits typed answers', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {typed answer, Enter} => panel advances, composer empties, POST carries labels [] and the typed text, panel closes and the continuation renders', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Clarify Submit Enter Guild',
      path: GUILD_PATH,
    });
    await sessions.createSessionFile({ sessionId: SESSION_ID, userMessage: 'Build the feature' });
    const created = await questHarness({ request }).createQuest({
      guildId: GuildIdStub({ value: String(guild.id) }),
      title: 'E2E Clarify Submit Enter Quest',
      userRequest: 'Build the feature',
    });
    await questHarness({ request }).writeQuestFile({
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: created.filePath,
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c1',
          role: 'chaoswhisperer',
          sessionId: SESSION_ID,
        },
      ],
    });
    claudeMock.queueResponse({ response: TWO_QUESTION_RESPONSE });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId: SESSION_ID, text: CONTINUATION_TEXT }),
    });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToQuest({ urlSlug, questId: created.questId });

    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 1 of 2');
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toBeVisible();

    await page.getByTestId('CLARIFY_COMPOSER').fill(TYPED_ANSWER);
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toHaveText(TYPED_ANSWER);
    await page.getByTestId('CLARIFY_COMPOSER').press('Enter');

    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toHaveText(QUESTION_TWO.question);
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toHaveText('');

    const clarifyRequestPromise = page.waitForRequest(
      (req) =>
        req.method() === 'POST' &&
        req.url().endsWith(`/api/quests/${String(created.questId)}/clarify`),
    );
    const clarifyResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().endsWith(`/api/quests/${String(created.questId)}/clarify`),
    );
    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Gamma' }).click();

    const clarifyRequest = await clarifyRequestPromise;
    const clarifyResponse = await clarifyResponsePromise;
    const { answers } = clarifyRequest.postDataJSON();

    expect(clarifyResponse.status()).toBe(HTTP_OK);
    expect(answers).toStrictEqual([
      { header: QUESTION_ONE.header, labels: [], text: TYPED_ANSWER },
      { header: QUESTION_TWO.header, labels: ['Gamma'] },
    ]);

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByText(CONTINUATION_TEXT)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT')).toHaveText('');
  });

  test('VALID: {typed answer, inline send button} => panel advances to question 2', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Clarify Submit Button Guild',
      path: GUILD_PATH,
    });
    await sessions.createSessionFile({ sessionId: SESSION_ID, userMessage: 'Build the feature' });
    const created = await questHarness({ request }).createQuest({
      guildId: GuildIdStub({ value: String(guild.id) }),
      title: 'E2E Clarify Submit Button Quest',
      userRequest: 'Build the feature',
    });
    await questHarness({ request }).writeQuestFile({
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: created.filePath,
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c2',
          role: 'chaoswhisperer',
          sessionId: SESSION_ID,
        },
      ],
    });
    claudeMock.queueResponse({ response: TWO_QUESTION_RESPONSE });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToQuest({ urlSlug, questId: created.questId });

    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 1 of 2');

    await page.getByTestId('CLARIFY_COMPOSER').fill(TYPED_ANSWER);
    await page.getByTestId('CLARIFY_SEND_BUTTON').click();

    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toHaveText(QUESTION_TWO.question);
  });

  test('VALID: {single-select card click} => advances to question 2 with no send step', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Clarify Submit Card Guild',
      path: GUILD_PATH,
    });
    await sessions.createSessionFile({ sessionId: SESSION_ID, userMessage: 'Build the feature' });
    const created = await questHarness({ request }).createQuest({
      guildId: GuildIdStub({ value: String(guild.id) }),
      title: 'E2E Clarify Submit Card Quest',
      userRequest: 'Build the feature',
    });
    await questHarness({ request }).writeQuestFile({
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: created.filePath,
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c3',
          role: 'chaoswhisperer',
          sessionId: SESSION_ID,
        },
      ],
    });
    claudeMock.queueResponse({ response: TWO_QUESTION_RESPONSE });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToQuest({ urlSlug, questId: created.questId });

    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 1 of 2');

    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Alpha' }).click();

    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');
    await expect(page.getByTestId('CLARIFY_QUESTION_TEXT')).toHaveText(QUESTION_TWO.question);
  });

  test('VALID: {stray composer text, single-select card click} => the sent answer is labels [Alpha] with no text key', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Clarify Submit Stray Guild',
      path: GUILD_PATH,
    });
    await sessions.createSessionFile({ sessionId: SESSION_ID, userMessage: 'Build the feature' });
    const created = await questHarness({ request }).createQuest({
      guildId: GuildIdStub({ value: String(guild.id) }),
      title: 'E2E Clarify Submit Stray Quest',
      userRequest: 'Build the feature',
    });
    await questHarness({ request }).writeQuestFile({
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: created.filePath,
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c4',
          role: 'chaoswhisperer',
          sessionId: SESSION_ID,
        },
      ],
    });
    claudeMock.queueResponse({ response: TWO_QUESTION_RESPONSE });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId: SESSION_ID, text: CONTINUATION_TEXT }),
    });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToQuest({ urlSlug, questId: created.questId });

    await page.getByTestId('CHAT_INPUT').fill('Start the quest');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await page.getByTestId('CLARIFY_COMPOSER').fill('stray text');
    await expect(page.getByTestId('CLARIFY_COMPOSER')).toHaveText('stray text');

    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Alpha' }).click();
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');

    const clarifyRequestPromise = page.waitForRequest(
      (req) =>
        req.method() === 'POST' &&
        req.url().endsWith(`/api/quests/${String(created.questId)}/clarify`),
    );
    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Gamma' }).click();

    const { answers } = (await clarifyRequestPromise).postDataJSON();

    expect(answers).toStrictEqual([
      { header: QUESTION_ONE.header, labels: ['Alpha'] },
      { header: QUESTION_TWO.header, labels: ['Gamma'] },
    ]);
  });
});
