import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';
import { clarifyComposerHarness } from '../../../test/harnesses/clarify-composer/clarify-composer.harness';

const GUILD_PATH = '/tmp/dm-e2e-clarify-send-failure';
const HTTP_BAD_REQUEST = 400;
const HTTP_OK = 200;
const HTTP_INTERNAL_ERROR = 500;

const SHAPE_QUESTION = {
  question: 'What shape should the feature take?',
  header: 'Shape',
  options: [
    { label: 'Round', description: 'A round one' },
    { label: 'Square', description: 'A square one' },
  ],
  multiSelect: false,
};
const COLOUR_QUESTION = {
  question: 'Which colour should the feature wear?',
  header: 'Colour',
  options: [
    { label: 'Red', description: 'A red one' },
    { label: 'Blue', description: 'A blue one' },
  ],
  multiSelect: false,
};
const MULTI_QUESTION = {
  question: 'Which flavours should the feature have?',
  header: 'Flavours',
  options: [
    { label: 'Alpha', description: 'The first flavour' },
    { label: 'Beta', description: 'The second flavour' },
  ],
  multiSelect: true,
};

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Clarify panel — a refused or failed send keeps every answer and says why', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('ERROR: {clarify POST answers 400} => the panel stays open and the composer still holds the text and its one thumbnail', async ({
    page,
    request,
  }) => {
    const clarify = clarifyComposerHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await clarify.openClarifyPanel({
      guildName: 'Clarify Refused Keeps Guild',
      questions: [SHAPE_QUESTION],
    });
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.composer().fill('like this');
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);
    await clarify.tamperNextClarifyPostIntoBmp();

    const refusal = clarify.waitForClarifyRefusal();
    await clarify.composer().press('Enter');

    expect((await refusal).status).toBe(HTTP_BAD_REQUEST);
    await expect(clarify.sendError()).toBeVisible();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible();
    await expect(clarify.composer()).toContainText('like this');
    await expect(clarify.thumbnails()).toHaveCount(1);
  });

  test('ERROR: {clarify POST answers 400} => the panel shows the error text from the response body', async ({
    page,
    request,
  }) => {
    const clarify = clarifyComposerHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await clarify.openClarifyPanel({
      guildName: 'Clarify Refused Text Guild',
      questions: [SHAPE_QUESTION],
    });
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.composer().fill('like this');
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);
    await clarify.tamperNextClarifyPostIntoBmp();

    const refusal = clarify.waitForClarifyRefusal();
    await clarify.composer().press('Enter');

    const { status, error } = await refusal;
    expect(status).toBe(HTTP_BAD_REQUEST);
    await expect(clarify.sendError()).toHaveText(String(error));
  });

  test('ERROR: {network is offline when the last question is sent} => the panel stays on the last question and the composer still holds the text and its one thumbnail', async ({
    page,
    request,
  }) => {
    const clarify = clarifyComposerHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await clarify.openClarifyPanel({
      guildName: 'Clarify Offline Guild',
      questions: [SHAPE_QUESTION, COLOUR_QUESTION],
    });
    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Round' }).click();
    await expect(clarify.counter()).toHaveText('Question 2 of 2');
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.composer().fill('like this');
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);
    await clarify.goOffline();

    await clarify.composer().press('Enter');

    await expect(clarify.sendError()).toBeVisible();
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible();
    await expect(clarify.counter()).toHaveText('Question 2 of 2');
    await expect(clarify.composer()).toContainText('like this');
    await expect(clarify.thumbnails()).toHaveCount(1);
    await clarify.goOnline();
  });

  test('VALID: {question 1 answered Alpha, last question POST answers 500, send again} => the second POST carries both answers', async ({
    page,
    request,
  }) => {
    const clarify = clarifyComposerHarness({
      page,
      request,
      guildPath: GUILD_PATH,
      sessions,
      claudeMock,
    });
    await clarify.openClarifyPanel({
      guildName: 'Clarify Resend Guild',
      questions: [MULTI_QUESTION, COLOUR_QUESTION],
    });
    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Alpha' }).click();
    await clarify.composer().press('Enter');
    await expect(clarify.counter()).toHaveText('Question 2 of 2');
    expect(clarify.clarifyPostCount()).toBe(0);
    await clarify.composer().fill('second');
    await clarify.corruptQuestFile();

    const firstStatus = clarify.waitForClarifyStatus();
    await clarify.composer().press('Enter');

    expect(await firstStatus).toBe(HTTP_INTERNAL_ERROR);
    await expect(clarify.sendError()).toBeVisible();
    await expect(clarify.counter()).toHaveText('Question 2 of 2');
    await clarify.restoreQuestFile();

    const secondStatus = clarify.waitForClarifyStatus();
    await clarify.composer().press('Enter');

    expect(await secondStatus).toBe(HTTP_OK);
    expect(clarify.clarifyPostCount()).toBe(2);
    expect(clarify.readClarifyAnswers({ postIndex: 1 })).toStrictEqual([
      { header: 'Flavours', labels: ['Alpha'] },
      { header: 'Colour', labels: [], text: 'second' },
    ]);
  });
});
