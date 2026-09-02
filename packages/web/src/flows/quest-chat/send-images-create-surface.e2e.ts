import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';

const GUILD_PATH = '/tmp/dm-e2e-send-images-create-surface';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;

// Restated rather than imported: an e2e scenario measures the CONTROL's own default selection, and
// this is questTypeOptionsStatics.defaultLabel's mapped questType ('feature') — a drift there must
// fail this spec's assertions rather than silently follow it. None of the tests below touch the
// QUEST_TYPE_PICKER dropdown, so every create-surface send in this file takes this default.
const DEFAULT_QUEST_TYPE = 'feature';

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Composer send — the create surface takes the image path', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await composerPasteHarness({ page }).beforeEach();
  });

  test('VALID: {composer holds one image, no questId yet} => the create POST carries images and the response is a real questId', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });

    const sessionId = `e2e-create-surface-image-path-${Date.now()}`;
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await composer.openComposerPage({
      request,
      guildName: 'Create Surface Image Path Guild',
      guildPath: GUILD_PATH,
    });

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

    const createRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/api\/guilds\/[^/]+\/quests$/u.test(req.url()),
    );
    const createResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && /\/api\/guilds\/[^/]+\/quests$/u.test(res.url()),
    );
    await page.keyboard.press('Enter');
    const createRequest = await createRequestPromise;
    const createResponse = await createResponsePromise;
    const createBody = await createResponse.json();

    // send-images-create-surface:observable:check-first-message-takes-image-path — the branch was
    // actually taken: a thumbnail-carrying composer on the create surface posts images, not a
    // text-only body, and the server answers with a real questId.
    expect({
      imagesLength: createRequest.postDataJSON().images.length,
      status: createResponse.status(),
      questIdIsNonEmpty: /^\S+$/u.test(String(createBody.questId)),
    }).toStrictEqual({ imagesLength: 1, status: HTTP_OK, questIdIsNonEmpty: true });
  });

  test('VALID: {"A" + one image + "B" on the create surface} => the POST body matches message, questType and images exactly', async ({
    page,
    request,
  }) => {
    const composer = composerPasteHarness({ page });

    const sessionId = `e2e-create-surface-body-shape-${Date.now()}`;
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await composer.openComposerPage({
      request,
      guildName: 'Create Surface Body Shape Guild',
      guildPath: GUILD_PATH,
    });

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

    const expectedBase64 = String(dataUrl).slice(String(dataUrl).indexOf(',') + 1);

    const createRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/api\/guilds\/[^/]+\/quests$/u.test(req.url()),
    );
    await page.keyboard.press('Enter');
    const createRequest = await createRequestPromise;

    // send-images-create-surface:observable:check-create-post-carries-images — one whole-object
    // assertion so a re-encoded base64 or a renamed key fails here rather than slipping past a
    // partial check.
    expect(createRequest.postDataJSON()).toStrictEqual({
      message: 'A[Pasted Image 1]B',
      questType: DEFAULT_QUEST_TYPE,
      images: [{ mediaType: 'image/png', dataBase64: expectedBase64 }],
    });
  });

  test('VALID: {create-surface send, then a mid-quest chat send with the same text and image bytes} => both POST bodies carry an identical message-plus-images pair', async ({
    page,
    request,
  }) => {
    test.slow();

    const composer = composerPasteHarness({ page });

    const sessionId = `e2e-create-surface-same-shape-${Date.now()}`;
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-1' }) });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-2' }) });

    await composer.openComposerPage({
      request,
      guildName: 'Create Surface Same Shape Guild',
      guildPath: GUILD_PATH,
    });

    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });

    await composer.focusComposer();
    await page.keyboard.type('A');
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');

    const createRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/api\/guilds\/[^/]+\/quests$/u.test(req.url()),
    );
    await page.keyboard.press('Enter');
    const createRequest = await createRequestPromise;

    await page.waitForURL(/\/quest\/[0-9a-f-]{36}/u, { timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });

    await composer.focusComposer();
    await page.keyboard.type('A');
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');

    const chatRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && /\/api\/quests\/[^/]+\/chat$/u.test(req.url()),
    );
    await page.keyboard.press('Enter');
    const chatRequest = await chatRequestPromise;

    const createBody = createRequest.postDataJSON();
    const chatBody = chatRequest.postDataJSON();

    // send-images-create-surface:observable:check-both-states-produce-same-body-shape — one
    // toStrictEqual so a re-encoded base64 or a renamed key on either route fails once rather than
    // slipping past two separate, weaker checks. The expected side is pinned to literals the test
    // knows independently (the typed message, the base64 sliced from the pasted dataUrl) rather than
    // to the OTHER route's body: comparing chatBody against itself is a tautology, and deriving the
    // expected images from one of the two actual bodies means a shared-broker regression that drops
    // images on BOTH routes at once leaves both sides undefined and passes green.
    expect({
      createMessage: createBody.message,
      chatMessage: chatBody.message,
      createImages: createBody.images,
      chatImages: chatBody.images,
      createUrlEndsWithQuests: createRequest.url().endsWith('/quests'),
      chatUrlEndsWithChat: chatRequest.url().endsWith('/chat'),
      createExtraKeys: Object.keys(createBody).filter(
        (key) => key !== 'message' && key !== 'images',
      ),
      chatExtraKeys: Object.keys(chatBody).filter((key) => key !== 'message' && key !== 'images'),
    }).toStrictEqual({
      createMessage: 'A[Pasted Image 1]B',
      chatMessage: 'A[Pasted Image 1]B',
      createImages: [
        {
          mediaType: 'image/png',
          dataBase64: String(dataUrl).slice(String(dataUrl).indexOf(',') + 1),
        },
      ],
      chatImages: [
        {
          mediaType: 'image/png',
          dataBase64: String(dataUrl).slice(String(dataUrl).indexOf(',') + 1),
        },
      ],
      createUrlEndsWithQuests: true,
      chatUrlEndsWithChat: true,
      createExtraKeys: ['questType'],
      chatExtraKeys: [],
    });
  });
});
