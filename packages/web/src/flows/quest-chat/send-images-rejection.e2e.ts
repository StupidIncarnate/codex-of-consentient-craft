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

const GUILD_PATH = '/tmp/dm-e2e-send-images-rejection';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;
const HTTP_BAD_REQUEST = 400;
const HTTP_INTERNAL_SERVER_ERROR = 500;

// The exact 400 body quest-followup-responder.ts answers with when
// isFollowupChatableQuestStatusGuard fails. Restated rather than derived, so a drift in the server's
// own copy fails THIS spec's assertions rather than silently following it — the whole point of
// unit send-images-rejection:observable:check-server-error-text-in-toast is that the toast shows
// this exact sentence, not a generic one.
const REJECTION_TEXT = 'Quest must be blocked, complete or merged for follow-up';

// The status setQuestStatusOnDisk moves a `blocked` quest to underneath an already-open FOLLOW-UP
// tab — legal per questStatusTransitionsStatics, and not follow-up-chatable, which is what makes
// the route refuse the send that reaches it.
const MOVED_TO_STATUS = 'in_progress';

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Composer send — images and a rejected send', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('INVALID: {FOLLOW-UP tab opened while chatable, quest moved to in_progress underneath, draft already saved} => the route answers 400 with the exact rejection sentence, and the composer/toast/draft/progress-bar all reflect a rejected-not-cleared terminal state', async ({
    page,
    request,
  }) => {
    test.slow();

    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });
    await send.recordComposerSendStates();

    const seeded = await followup.seedAndOpen({
      guildName: 'Send Images Rejection Draft Guild',
      status: 'blocked',
    });
    const questId = String(seeded.questId);
    const questFilePath = String(seeded.questFilePath);

    await followup.pressFollowup();

    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    // Precondition, not the mutation under test — moves the quest out from under the already-open
    // tab. The send that meets the moved status is a real keypress in the real composer, below.
    followup.setQuestStatusOnDisk({ questFilePath, status: MOVED_TO_STATUS });

    // Before-state, captured while the composer still holds real content — the control that stops
    // every "unchanged after rejection" assertion below from passing vacuously against an
    // already-empty composer/draft.
    const childSummariesBefore = await composer.readComposerChildSummaries();
    const draftTextBefore = await composer.readDraftText();
    const draftImageRecordsBefore = await composer.readDraftImageRecords();
    expect(draftTextBefore).toBe('A[Pasted Image 1]B[Pasted Image 2]');
    expect(draftImageRecordsBefore.length).toBe(2);

    const rejectionPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes(`/api/quests/${questId}/followup`),
    );
    await page.keyboard.press('Enter');
    const rejection = await rejectionPromise;

    // send-images-rejection:branch:accepted-no — the real response status, forced rather than
    // assumed.
    expect(rejection.status()).toBe(HTTP_BAD_REQUEST);
    const rejectionBody = await rejection.json();
    expect(rejectionBody).toStrictEqual({ error: REJECTION_TEXT });

    // branch:accepted-no's other half: the composer is on the rejected terminal, not cleared — its
    // text and thumbnails are still exactly what they were before the Enter.
    expect(await composer.readComposerTextContent()).toBe('AB');
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    // send-images-rejection:observable:check-server-error-text-in-toast — the toast shows the
    // server's exact sentence, read via the harness method scoped to the Mantine notifications
    // container, never a bare page.getByText (which would also match the ERROR chat entry).
    expect(await send.readToastTexts()).toStrictEqual([REJECTION_TEXT]);

    // send-images-rejection:terminal:send-rejected — re-enabled, no stuck spinner, unchanged
    // composer, no half-written file.
    expect(await composer.readContentEditableAttribute()).toBe('true');
    await expect(page.getByTestId('CHAT_INPUT_UPLOAD_PROGRESS')).toHaveCount(0);
    const imagesDir = await send.readQuestImagesDir({ questFilePath });
    expect(imagesDir.exists).toBe(false);

    // send-images-rejection:observable:check-composer-reenabled-intact — SEND_BUTTON enabled and
    // the child summaries are EXACTLY the captured before-state (same text runs, same two image
    // srcs, same order).
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });
    expect(await composer.readComposerChildSummaries()).toStrictEqual(childSummariesBefore);

    // send-images-rejection:observable:check-draft-survives-rejection — both stores still hold
    // exactly what they held before the Enter.
    expect(await composer.readDraftText()).toBe(draftTextBefore);
    expect(await composer.readDraftImageRecords()).toStrictEqual(draftImageRecordsBefore);

    // send-images-rejection:observable:check-progress-bar-gone-on-rejection — the during-send
    // recording proves the bar really did mount for this send, which is what stops the
    // now-count-0 assertion above from passing vacuously against a bar that never appeared.
    const states = await send.readComposerSendStates();
    expect(states.some((entry) => entry.barPresent === true)).toBe(true);
  });

  test('INVALID: {FOLLOW-UP rejection reached before any draft had been saved} => the rejection itself leaves the composer recoverable, with a draft written at the point of failure', async ({
    page,
    request,
  }) => {
    test.slow();

    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    const composer = composerPasteHarness({ page });

    const seeded = await followup.seedAndOpen({
      guildName: 'Send Images Rejection No Draft Guild',
      status: 'blocked',
    });
    const questId = String(seeded.questId);
    const questFilePath = String(seeded.questFilePath);

    await followup.pressFollowup();

    await composer.focusComposer();
    await page.keyboard.type('A');
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type('B');
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_PANEL').getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    followup.setQuestStatusOnDisk({ questFilePath, status: MOVED_TO_STATUS });

    // Wipes the draft that typing/pasting above already wrote, so the send below starts from a
    // genuinely empty draft store — the precondition this unit is about.
    await composer.clearDraftStorage();
    expect(await composer.readDraftText()).toBe(null);
    expect(await composer.readDraftImageRecords()).toStrictEqual([]);

    const rejectionPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes(`/api/quests/${questId}/followup`),
    );
    await page.keyboard.press('Enter');
    const rejection = await rejectionPromise;
    expect(rejection.status()).toBe(HTTP_BAD_REQUEST);

    // send-images-rejection:observable:check-rejection-writes-draft-when-none-saved — the work is
    // recoverable even though no draft existed the instant the send started: the rejection's own
    // `handleContentChanged({ force: true })` call writes one now.
    expect(await composer.readDraftText()).toBe('A[Pasted Image 1]B[Pasted Image 2]');
    expect(await composer.readDraftImageAttachmentIds()).toStrictEqual(
      await composer.readThumbnailAttachmentIds(),
    );
  });

  test('ERROR: {images dir blocked by a regular file, chat route} => the toast shows the exact 500 error sentence the response body carried, not a generic failure message', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const send = composerSendHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Send Images Rejection Write Failure Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-images-rejection-write-failure-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Images Rejection Write Failure Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f8',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    // Forces the write-failure branch: a regular FILE occupies the path the server's recursive
    // mkdir needs to create as a directory.
    send.blockImagesDir({ questFilePath });

    await composer.focusComposer();
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const rejectionPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const rejection = await rejectionPromise;

    expect(rejection.status()).toBe(HTTP_INTERNAL_SERVER_ERROR);
    const rejectionBody = await rejection.json();
    // Compared against the value read off the wire, never a hardcoded fs message — the responder's
    // catch answers with the thrown error's own message, whatever Node's mkdir happened to say.
    expect(await send.readToastTexts()).toStrictEqual([String(rejectionBody.error)]);
  });

  test('VALID: {write failure rejected, images dir unblocked, user edits and retries} => the second POST carries the edited text, the same two images the first attempt sent, and the response is 200', async ({
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
      name: 'Send Images Rejection Retry Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-images-rejection-retry-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Images Rejection Retry Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f9',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    send.blockImagesDir({ questFilePath });
    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

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

    const firstRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const firstResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const firstRequest = await firstRequestPromise;
    const firstResponse = await firstResponsePromise;
    expect(firstResponse.status()).toBe(HTTP_INTERNAL_SERVER_ERROR);
    expect(send.readPostCount()).toBe(1);

    // The composer has to fully re-enable before the retry keypress can land — see
    // check-composer-reenabled-intact above for why this is a real, not assumed, wait.
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });

    send.unblockImagesDir({ questFilePath });

    // Places the caret after the LAST child (text 'A', image 1, text 'B', image 2) rather than
    // relying on where a plain click happens to land inside existing multi-node content — a
    // rejection drops focus off the composer (contenteditable flips false then true again), so the
    // caret position is not something a bare retry keypress can assume.
    const childSummaries = await composer.readComposerChildSummaries();
    await composer.placeCaretBetweenChildren({ index: childSummaries.length });
    await page.keyboard.type('C');

    const secondRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const secondResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const secondRequest = await secondRequestPromise;
    const secondResponse = await secondResponsePromise;

    // send-images-rejection:branch:rejected-back — a SECOND POST really did fire, carrying the
    // edited text AND both tokens, with the SAME two images the first (rejected) attempt sent, and
    // this time the server accepts it.
    expect(send.readPostCount()).toBe(2);
    expect(secondRequest.postDataJSON()).toStrictEqual({
      message: 'A[Pasted Image 1]B[Pasted Image 2]C',
      images: firstRequest.postDataJSON().images,
    });
    expect(secondResponse.status()).toBe(HTTP_OK);
  });
});
