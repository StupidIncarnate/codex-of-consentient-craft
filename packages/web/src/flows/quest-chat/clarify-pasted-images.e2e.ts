import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';
import { clarifyComposerHarness } from '../../../test/harnesses/clarify-composer/clarify-composer.harness';

const GUILD_PATH = '/tmp/dm-e2e-clarify-pasted-images';
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;
const MAX_IMAGES_PER_MESSAGE = 5;

// Restated rather than imported: an e2e scenario measures the USER-FACING copy, so a drift in
// chatComposerStatics.toasts fails this file instead of silently following it.
const TOAST_UNSUPPORTED_FORMAT = 'Only PNG, JPEG, GIF and WebP images can be pasted';
const TOAST_TOO_MANY_IMAGES = 'A message can carry at most 5 images';

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
    { label: 'Gamma', description: 'The third flavour' },
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

test.describe('Clarify panel — the shared composer accepts, refuses and sends pasted images', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('INVALID: {paste image/bmp, then a PNG} => bmp inserts nothing and shows the unsupported-format toast, the panel stays on the same question, the PNG retry inserts one thumbnail', async ({
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
      guildName: 'Clarify Paste Bmp Guild',
      questions: [SHAPE_QUESTION],
    });

    await clarify.pasteBytes({ bytes: [0x00, 0x01, 0x02, 0x03], mediaType: 'image/bmp' });

    await expect(page.getByText(TOAST_UNSUPPORTED_FORMAT, { exact: true })).toBeVisible();
    await expect(clarify.thumbnails()).toHaveCount(0);
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).toBeVisible();
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 1 of 1');

    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.pasteImage({ dataUrl: String(dataUrl) });

    await expect(clarify.thumbnails()).toHaveCount(1);
  });

  test('EDGE: {5 thumbnails in the clarify composer, paste a 6th} => the toast shows and exactly 5 thumbnails remain', async ({
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
      guildName: 'Clarify Paste Sixth Guild',
      questions: [SHAPE_QUESTION],
    });
    const seeds = Array.from({ length: MAX_IMAGES_PER_MESSAGE }, (_unused, index) => index + 1);
    await seeds.reduce(async (previous, seed) => {
      await previous;
      const dataUrl = await clarify.buildPngDataUrl({ seed });
      await clarify.pasteImage({ dataUrl: String(dataUrl) });
      await expect(clarify.thumbnails()).toHaveCount(seed);
    }, Promise.resolve());
    const sixthDataUrl = await clarify.buildPngDataUrl({ seed: MAX_IMAGES_PER_MESSAGE + 1 });

    await clarify.pasteImage({ dataUrl: String(sixthDataUrl) });

    await expect(page.getByText(TOAST_TOO_MANY_IMAGES, { exact: true })).toBeVisible();
    await expect(clarify.thumbnails()).toHaveCount(MAX_IMAGES_PER_MESSAGE);
  });

  test('VALID: {paste one PNG, click its thumbnail} => exactly one thumbnail with the pasted src lands in the clarify composer, none in the chat composer, and the overlay shows it', async ({
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
      guildName: 'Clarify Paste Overlay Guild',
      questions: [SHAPE_QUESTION],
    });
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });

    await clarify.pasteImage({ dataUrl: String(dataUrl) });

    await expect(clarify.thumbnails()).toHaveCount(1);
    await expect(page.getByTestId('CHAT_INPUT').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
    await expect(clarify.thumbnails().first()).toHaveAttribute('src', String(dataUrl));

    await clarify.thumbnails().first().click();

    await expect(page.getByTestId('IMAGE_OVERLAY')).toBeVisible();
    await expect(page.getByTestId('IMAGE_OVERLAY_IMAGE')).toHaveAttribute('src', String(dataUrl));
  });

  test('VALID: {type "like this", paste one PNG, Enter} => the one POST carries the text, the placeholder and the PNG bytes, then the panel closes and no thumbnail remains', async ({
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
      guildName: 'Clarify Paste Send Guild',
      questions: [SHAPE_QUESTION],
    });
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.composer().fill('like this');
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);

    const status = clarify.waitForClarifyStatus();
    await clarify.composer().press('Enter');

    expect(await status).toBe(HTTP_OK);
    expect(clarify.clarifyPostCount()).toBe(1);
    expect(clarify.readClarifyAnswers({ postIndex: 0 })).toStrictEqual([
      {
        header: 'Shape',
        labels: [],
        text: 'like this[Pasted Image 1]',
        images: [
          {
            mediaType: 'image/png',
            dataBase64: clarify.dataUrlBase64({ dataUrl: String(dataUrl) }),
          },
        ],
      },
    ]);
    await expect(page.getByTestId('QUEST_CLARIFY_PANEL')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
  });

  test('VALID: {paste one PNG, no typed text, Enter} => the answer text is the placeholder and its images list holds the PNG', async ({
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
      guildName: 'Clarify Paste Only Guild',
      questions: [SHAPE_QUESTION],
    });
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);

    await clarify.composer().press('Enter');

    await expect.poll(() => clarify.clarifyPostCount()).toBe(1);
    expect(clarify.readClarifyAnswers({ postIndex: 0 })).toStrictEqual([
      {
        header: 'Shape',
        labels: [],
        text: '[Pasted Image 1]',
        images: [
          {
            mediaType: 'image/png',
            dataBase64: clarify.dataUrlBase64({ dataUrl: String(dataUrl) }),
          },
        ],
      },
    ]);
  });

  test('VALID: {PNG pasted into question 1, send, answer question 2} => no POST on question 1, one POST after question 2 carrying the PNG in answer 1', async ({
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
      guildName: 'Clarify Paste Held Guild',
      questions: [SHAPE_QUESTION, COLOUR_QUESTION],
    });
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);

    await clarify.composer().press('Enter');

    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');
    expect(clarify.clarifyPostCount()).toBe(0);

    await clarify.composer().fill('second');
    await clarify.composer().press('Enter');

    await expect.poll(() => clarify.clarifyPostCount()).toBe(1);
    expect(clarify.readClarifyAnswers({ postIndex: 0 })).toStrictEqual([
      {
        header: 'Shape',
        labels: [],
        text: '[Pasted Image 1]',
        images: [
          {
            mediaType: 'image/png',
            dataBase64: clarify.dataUrlBase64({ dataUrl: String(dataUrl) }),
          },
        ],
      },
      { header: 'Colour', labels: [], text: 'second' },
    ]);
  });

  test('VALID: {multiSelect, Gamma then Alpha checked, one PNG pasted, Enter} => the answer carries labels in option order, the placeholder and one image', async ({
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
      guildName: 'Clarify Paste Multi Guild',
      questions: [MULTI_QUESTION],
    });
    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Gamma' }).click();
    await page.getByTestId('CLARIFY_OPTION').filter({ hasText: 'Alpha' }).click();
    const dataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.pasteImage({ dataUrl: String(dataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);

    await clarify.composer().press('Enter');

    await expect.poll(() => clarify.clarifyPostCount()).toBe(1);
    expect(clarify.readClarifyAnswers({ postIndex: 0 })).toStrictEqual([
      {
        header: 'Flavours',
        labels: ['Alpha', 'Gamma'],
        text: '[Pasted Image 1]',
        images: [
          {
            mediaType: 'image/png',
            dataBase64: clarify.dataUrlBase64({ dataUrl: String(dataUrl) }),
          },
        ],
      },
    ]);
  });

  test('VALID: {one distinct PNG in each of two answers} => each answer reads the first placeholder and carries its own PNG', async ({
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
      guildName: 'Clarify Paste Numbering Guild',
      questions: [SHAPE_QUESTION, COLOUR_QUESTION],
    });
    const firstDataUrl = await clarify.buildPngDataUrl({ seed: 1 });
    await clarify.pasteImage({ dataUrl: String(firstDataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);
    await clarify.composer().press('Enter');
    await expect(page.getByTestId('CLARIFY_COUNTER')).toHaveText('Question 2 of 2');
    const secondDataUrl = await clarify.buildPngDataUrl({ seed: 2 });
    await clarify.pasteImage({ dataUrl: String(secondDataUrl) });
    await expect(clarify.thumbnails()).toHaveCount(1);

    await clarify.composer().press('Enter');

    await expect.poll(() => clarify.clarifyPostCount()).toBe(1);
    expect(clarify.readClarifyAnswers({ postIndex: 0 })).toStrictEqual([
      {
        header: 'Shape',
        labels: [],
        text: '[Pasted Image 1]',
        images: [
          {
            mediaType: 'image/png',
            dataBase64: clarify.dataUrlBase64({ dataUrl: String(firstDataUrl) }),
          },
        ],
      },
      {
        header: 'Colour',
        labels: [],
        text: '[Pasted Image 1]',
        images: [
          {
            mediaType: 'image/png',
            dataBase64: clarify.dataUrlBase64({ dataUrl: String(secondDataUrl) }),
          },
        ],
      },
    ]);
  });
});
