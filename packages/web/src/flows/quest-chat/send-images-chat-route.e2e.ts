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
import {
  SessionIdStub,
  TimeoutMsStub,
  SystemInitStreamLineStub,
  AssistantTextStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

const GUILD_PATH = '/tmp/dm-e2e-send-images-chat-route';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;

// Large enough that a real XHR upload reports more than one progress tick — a tiny image may fire
// only the single terminal event. Measured (not assumed) against these bounds in the test itself,
// via composerPasteHarness.readDataUrlByteLength, so the input's size class is proven rather than
// guessed at. The upper bound sits comfortably under pastedImageStatics.maxBytesPerImage
// (5,242,880), so this never crosses into the downscale-ladder path.
const LARGE_IMAGE_WIDTH_PX = 1_500;
const LARGE_IMAGE_NOISE_BAND_ROWS = 100;
const LARGE_IMAGE_MIN_BYTES = 200_000;
const LARGE_IMAGE_MAX_BYTES = 5_000_000;
// Loopback bandwidth to the dev server is fast enough that a multi-hundred-KB upload completes
// inside Chromium's single progress-event throttle window — the real cause this test hit first
// (measured: byte-size alone, up to ~10MB combined, still produced exactly one `progress` tick).
// CDP's own network-condition emulation (not `page.route`, which is banned here) throttles the
// upload's wire speed so the browser has time to fire more than one tick — this is what actually
// makes 0→100 observable rather than sample-of-one.
const UPLOAD_THROTTLE_BYTES_PER_SEC = 200_000;

const FORWARD_DELAY_MS = 3_000;
const FORWARD_REPLY_TEXT = 'This reply streamed in after the HTTP response already resolved';

// How long delayXhrDispatch holds the chat POST's real dispatch back — long enough that a second
// paste, driven through a real page.evaluate round trip, reliably lands well before the request
// reaches the network, without relying on loopback timing.
const XHR_RACE_DELAY_MS = 3_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Composer send — images ride the chat route', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {plain Enter with 2 thumbnails mounted} => issues exactly 1 POST carrying images.length 2, text gains no newline, and the response is 200 with a real chatProcessId', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Plain Enter Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-plain-enter-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Plain Enter Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f1',
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

    const textBeforeEnter = await composer.readComposerTextContent();

    const chatRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    // Plain Enter — Shift is NOT held. A newline-inserting composer would mutate the text BEFORE
    // ever reaching the network, so the text is read back immediately, before the response is
    // awaited, to catch that mutation rather than the (already-cleared) post-acceptance state.
    await page.keyboard.press('Enter');
    expect(await composer.readComposerTextContent()).toBe(textBeforeEnter);

    const chatRequest = await chatRequestPromise;
    expect(chatRequest.postDataJSON().images.length).toBe(2);

    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);
    const chatBody = await chatResponse.json();
    expect(String(chatBody.chatProcessId)).toMatch(/^\S+$/u);
  });

  test('VALID: {type "A", paste image 1, type "B", paste image 2, type "C", plain Enter} => POST body toStrictEqual the tokenised message and the two images in paste order', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Token Order Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-token-order-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Token Order Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f2',
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

    const expectedBase64First = String(dataUrl1).slice(String(dataUrl1).indexOf(',') + 1);
    const expectedBase64Second = String(dataUrl2).slice(String(dataUrl2).indexOf(',') + 1);

    const chatRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatRequest = await chatRequestPromise;

    // ONE whole-object assertion, covering three separately-breakable invariants at once: the
    // "message" field proves the ordinal is a strict left-to-right COUNT (breaks if
    // composer-serialize-transformer's `imageCount + 1` ordinal breaks); the "images" array's ORDER
    // proves attachments ride first-pasted-first (breaks if the attachmentIds append order
    // reverses); and the object's exact key set proves neither entry lost its mediaType nor gained
    // an extra key. Built from two DIFFERENT seeds, so the two entries' bytes genuinely differ —
    // that is what makes a reversed array fail rather than pass by coincidence.
    expect(chatRequest.postDataJSON()).toStrictEqual({
      message: 'A[Pasted Image 1]B[Pasted Image 2]C',
      images: [
        { mediaType: 'image/png', dataBase64: expectedBase64First },
        { mediaType: 'image/png', dataBase64: expectedBase64Second },
      ],
    });
  });

  test('VALID: {type "Ping", plain Enter, plain Enter again immediately} => exactly 1 POST fires, before AND after the response resolves', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send One Enter Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-one-enter-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send One Enter Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f3',
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
    const send = composerSendHarness({ page });
    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

    await composer.focusComposer();
    await page.keyboard.type('Ping');

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    expect(send.readPostCount()).toBe(1);

    // Fired a SECOND time before the first response has resolved. A real `page.keyboard.press`
    // cannot reach this case a second time: the first Enter already flips `contenteditable` to
    // `"false"`, which drops browser focus off CHAT_INPUT, so a second OS-level keypress lands on
    // nothing the composer's own `onKeyDown` ever sees — measured directly, not assumed. Dispatching
    // the second Enter at the element (composerSendHarness.dispatchEnterKeydown) is what still
    // reaches the real `onKeyDown` → `handleSend` path despite that focus loss, which is what
    // actually exercises `handleSend`'s own `if (isSending) return;` guard.
    await send.dispatchEnterKeydown();
    expect(send.readPostCount()).toBe(1);

    await chatResponsePromise;
    expect(send.readPostCount()).toBe(1);
  });

  // RACE 2: SEND_BUTTON clicked twice with no `await` between the two `.click()` calls (both fire
  // inside ONE synchronous browser script — see composerSendHarness's own comment on why a
  // Node-side `page.locator(...).click()` twice in a row cannot reach this). `handleSend`'s
  // re-entrancy guard used to read the `isSending` STATE, which is not yet visible to a second
  // synchronous call — this is what let two POSTs through for one click. The sibling test above
  // ("type Ping, plain Enter, plain Enter again immediately") only proves the guard holds when a
  // real Node-side round trip separates the two attempts; it never puts two calls in the same tick.
  test('VALID: {1 thumbnail, SEND_BUTTON clicked twice with no await between the clicks} => exactly 1 POST fires and the quest images dir gains exactly 1 file', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Double Click Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-double-click-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Double Click Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000fb',
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
    const send = composerSendHarness({ page });
    send.recordPosts({ urlSuffix: `/api/quests/${questId}/chat` });

    await composer.focusComposer();
    await page.keyboard.type('double submit test ');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await send.clickSendButtonTwiceWithNoAwaitBetween();
    await chatResponsePromise;
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });

    expect(send.readPostCount()).toBe(1);

    const imagesDir = await send.readQuestImagesDir({ questFilePath: String(created.filePath) });
    expect(imagesDir.fileNames.length).toBe(1);
  });

  // RACE 3: a second, DIFFERENT image is pasted while the first send's request is still in flight.
  // `delayXhrDispatch` holds the real POST's actual network dispatch back by XHR_RACE_DELAY_MS so
  // the in-flight window is wide enough to act inside deterministically — the request still carries
  // the real body to the real server, only later than it otherwise would (see the harness comment).
  // handleSend's success handler used to call `editor.replaceChildren()` unconditionally, wiping
  // whatever the LIVE editor held once the response came back rather than just what it had sent —
  // which destroys the second paste with no toast and no trace.
  test('VALID: {type "first message ", paste image 1, SEND, then paste image 2 before the delayed request resolves} => the in-flight request carries only image 1, and once it resolves the composer still holds image 2 rather than being wiped', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Race Survivor Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-race-survivor-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Race Survivor Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000fc',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    const send = composerSendHarness({ page });
    await send.delayXhrDispatch({
      urlSuffix: `/api/quests/${questId}/chat`,
      delayMs: XHR_RACE_DELAY_MS,
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    await page.keyboard.type('first message ');
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const chatRequestPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith(`/api/quests/${questId}/chat`),
    );
    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');

    // Pasted BEFORE awaiting either promise above — the injected dispatch delay holds the actual
    // network send back for XHR_RACE_DELAY_MS, and the mocked server answers within milliseconds of
    // that real dispatch, so the only reliably wide window to act inside is between the CLICK and
    // the delayed dispatch, not between dispatch and response. This is what makes the second image's
    // own async insert (FileReader + attach broker, well under a second) land in the DOM long before
    // either promise below resolves — the same ordering the original repro observed.
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    const pasted = await composer.pasteImage({ dataUrl: String(dataUrl2) });
    // preventDefault fired — the paste was accepted for processing despite the composer being
    // locked (contenteditable="false") for the in-flight send.
    expect(pasted).toBe(false);
    // Both images sit in the live DOM at once, well before the delayed request even reaches the
    // network — the control that proves the second paste's insert is not just accepted but actually
    // landed before anything about the send has settled.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    // The delayed dispatch is what makes this a genuine (not hopeful) in-flight window: this only
    // resolves once XHR_RACE_DELAY_MS has actually elapsed and the real `.send()` finally ran, so
    // this proves the SNAPSHOT taken at send-time carried only image 1, even though the live DOM
    // now (correctly) holds both.
    const chatRequest = await chatRequestPromise;
    const expectedBase64First = String(dataUrl1).slice(String(dataUrl1).indexOf(',') + 1);
    expect(chatRequest.postDataJSON()).toStrictEqual({
      message: 'first message [Pasted Image 1]',
      images: [{ mediaType: 'image/png', dataBase64: expectedBase64First }],
    });

    await chatResponsePromise;

    // The second image survives: exactly it, not zero, not both. The surviving draft TEXT still
    // carries its own placeholder token — composerSerializeTransformer always embeds
    // `[Pasted Image N]` for a present image, renumbered from 1 now that it is the only attachment
    // left, so `null` would be wrong even in a fully correct composer.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readThumbnailSrcs()).toStrictEqual([String(dataUrl2)]);
    const [survivingAttachmentId] = await composer.readThumbnailAttachmentIds();
    expect(await composer.readDraftImageRecords()).toStrictEqual([
      {
        attachmentId: survivingAttachmentId,
        mediaType: 'image/png',
        dataBase64: String(dataUrl2).slice(String(dataUrl2).indexOf(',') + 1),
      },
    ]);
    expect(await composer.readDraftText()).toBe('[Pasted Image 1]');
  });

  test('VALID: {send with 2 images} => the composer is locked (uneditable, SEND disabled) at some point during the send, and unlocked (editable, SEND enabled) once the turn has fully ended', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Locked Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const send = composerSendHarness({ page });
    await send.recordComposerSendStates();

    const sessionId = `e2e-send-locked-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Locked Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f4',
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
    const dataUrl1 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const dataUrl2 = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 2,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    await chatResponsePromise;

    // The turn has to fully END (not merely be accepted) before the control unlocks — see
    // packages/web/CLAUDE.md's isStreaming/pendingTurn note. A retrying wait is what lets the test
    // observe that eventual settle rather than a point-in-time read racing the WS completion frame.
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });

    const states = await send.readComposerSendStates();
    const lockStates = states.map((entry: { contentEditable: unknown; sendDisabled: unknown }) => ({
      contentEditable: entry.contentEditable,
      sendDisabled: entry.sendDisabled,
    }));

    // The real recorded sequence for a mid-quest send is idle(true,false) → locked(false,null) →
    // idle(true,false): `isStreaming` (armed in the SAME React commit as `isSending`, since both
    // are set synchronously inside the one Enter keydown handler) swaps SEND_BUTTON for STOP_BUTTON
    // before any paint could show SEND_BUTTON with `disabled=true` — so `sendDisabled` transitions
    // false → null → false and never literally reads `true` for this composer. `null` (SEND_BUTTON
    // absent because STOP_BUTTON is mounted instead) is locked exactly as hard as `disabled=true`
    // would be: neither renders an actionable SEND control. `!== false` is what the invariant
    // actually is: not-available-to-click, whichever of the two shapes that takes.
    const wasLocked = lockStates.some(
      (s) => s.contentEditable === 'false' && s.sendDisabled !== false,
    );
    expect(wasLocked).toBe(true);

    expect(lockStates[lockStates.length - 1]).toStrictEqual({
      contentEditable: 'true',
      sendDisabled: false,
    });
  });

  // An aborted /chat POST used to leave the composer stuck non-editable until a full page reload:
  // xhrPostWithProgressAdapter listened for 'load'/'error'/'timeout' but never 'abort', so an
  // aborted XHR's wrapping promise never settled — handleSend's own `.finally` (which resets
  // isSending, and with it CHAT_INPUT's contenteditable) never ran, and no error ever surfaced.
  // `abortXhrAfterSend` reproduces the walker's exact repro: the real send() runs (the request
  // reaches the network) and is aborted in the SAME synchronous tick send() returns.
  test('ERROR: {chat POST aborted mid-flight, in the same tick send() returns} => the composer becomes editable again and SEND_BUTTON re-enables on its own, with an error toast shown, and no page reload', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Aborted Xhr Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-aborted-xhr-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Aborted Xhr Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000fd',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    // Queued so the server side has something to answer with if it ever gets far enough to ask —
    // irrelevant to this test's own assertions, all of which are client-side, but keeps the mocked
    // CLI from being left waiting on a session nothing ever responds to.
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    const send = composerSendHarness({ page });
    await send.recordComposerSendStates();
    await send.abortXhrAfterSend({ urlSuffix: `/api/quests/${questId}/chat` });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const composer = composerPasteHarness({ page });
    await composer.focusComposer();
    await page.keyboard.type('will be aborted');
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 1,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    await page.keyboard.press('Enter');

    // The composer must recover ON ITS OWN — no reload — once the abort settles the send promise.
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });
    expect(await composer.readContentEditableAttribute()).toBe('true');

    // A user whose send died deserves to know.
    const toasts = await send.readToastTexts();
    expect(toasts).toStrictEqual([
      `xhrPostWithProgressAdapter: request to /api/quests/${questId}/chat was aborted`,
    ]);

    // The lock/unlock recording proves the composer actually PASSED THROUGH a locked state before
    // recovering, rather than this being a composer that was never locked in the first place —
    // which would pass the two checks above vacuously.
    const states = await send.readComposerSendStates();
    const wasLocked = states.some(
      (entry) => entry.contentEditable === 'false' && entry.sendDisabled !== false,
    );
    expect(wasLocked).toBe(true);
  });

  test('VALID: {send 2 images large enough to be measurable} => an upload progress bar paints beneath the composer, its aria-valuenow climbs from 0 to 100, and it is gone once the send is accepted', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Progress Bar Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const send = composerSendHarness({ page });
    await send.recordComposerSendStates();

    const sessionId = `e2e-send-progress-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Progress Bar Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f5',
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

    const dataUrl1 = await composer.buildOverCapImageDataUrl({
      widthPx: LARGE_IMAGE_WIDTH_PX,
      heightPx: LARGE_IMAGE_NOISE_BAND_ROWS,
      noiseBandRows: LARGE_IMAGE_NOISE_BAND_ROWS,
    });
    const byteLength1 = Number(await composer.readDataUrlByteLength({ dataUrl: String(dataUrl1) }));
    expect(byteLength1).toBeGreaterThan(LARGE_IMAGE_MIN_BYTES);
    expect(byteLength1).toBeLessThan(LARGE_IMAGE_MAX_BYTES);
    await composer.pasteImage({ dataUrl: String(dataUrl1) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    const dataUrl2 = await composer.buildOverCapImageDataUrl({
      widthPx: LARGE_IMAGE_WIDTH_PX,
      heightPx: LARGE_IMAGE_NOISE_BAND_ROWS,
      noiseBandRows: LARGE_IMAGE_NOISE_BAND_ROWS,
    });
    const byteLength2 = Number(await composer.readDataUrlByteLength({ dataUrl: String(dataUrl2) }));
    expect(byteLength2).toBeGreaterThan(LARGE_IMAGE_MIN_BYTES);
    expect(byteLength2).toBeLessThan(LARGE_IMAGE_MAX_BYTES);
    await composer.pasteImage({ dataUrl: String(dataUrl2) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(2);

    await page.bringToFront();
    await page.screenshot();
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');

    const cdpSession = await page.context().newCDPSession(page);
    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: UPLOAD_THROTTLE_BYTES_PER_SEC,
    });

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    await chatResponsePromise;

    await cdpSession.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
    });

    const states = await send.readComposerSendStates();

    const barGeometry = states.map(
      (entry: {
        barPresent: unknown;
        visibilityState: unknown;
        barRect: { height: unknown; y: unknown } | null;
        inputRect: { y: unknown } | null;
      }) => ({
        barPresent: entry.barPresent,
        visibilityState: entry.visibilityState,
        barHeight: entry.barRect === null ? null : entry.barRect.height,
        barY: entry.barRect === null ? null : entry.barRect.y,
        inputY: entry.inputRect === null ? null : entry.inputRect.y,
      }),
    );

    const paintedBelowInput = barGeometry.some(
      (g) =>
        g.barPresent === true &&
        g.visibilityState === 'visible' &&
        typeof g.barHeight === 'number' &&
        g.barHeight > 0 &&
        typeof g.barY === 'number' &&
        typeof g.inputY === 'number' &&
        g.barY > g.inputY,
    );
    expect(paintedBelowInput).toBe(true);

    const ariaValues = states
      .map((entry: { ariaValueNow: unknown }) => entry.ariaValueNow)
      .filter((value) => typeof value === 'string');
    expect({ first: ariaValues[0], last: ariaValues[ariaValues.length - 1] }).toStrictEqual({
      first: '0',
      last: '100',
    });

    // The during-send recording above is what stops this next assertion passing vacuously — a bar
    // that never mounted would also read count 0.
    await expect(page.getByTestId('CHAT_INPUT_UPLOAD_PROGRESS')).toHaveCount(0);
  });

  test('VALID: {plain Enter, agent reply delayed} => the HTTP response resolves and the composer clears BEFORE the delayed reply lands in the transcript', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Send Forward Accepted Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-forward-accepted-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Forward Accepted Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f6',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const sessionIdStub = SessionIdStub({ value: sessionId });
    claudeMock.queueResponse({
      response: {
        sessionId: sessionIdStub,
        delayMs: TimeoutMsStub({ value: FORWARD_DELAY_MS }),
        lines: [
          streamLineToJsonLineTransformer({
            streamLine: SystemInitStreamLineStub({ session_id: sessionIdStub }),
          }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: FORWARD_REPLY_TEXT }],
              },
            }),
          }),
        ],
      },
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

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');

    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    // The fork: the response does not wait on the spawn. At the instant the response resolved, the
    // delayed reply has not streamed in yet, and the composer has already acted on acceptance.
    await expect(page.getByText(FORWARD_REPLY_TEXT)).not.toBeVisible();
    expect(await composer.readComposerTextContent()).toBe('');
    expect(await composer.readThumbnailCount()).toBe(0);

    await expect(page.getByText(FORWARD_REPLY_TEXT)).toBeVisible({
      timeout: FORWARD_DELAY_MS * 2,
    });
  });

  test("VALID: {send 2 images, accepted} => the composer clears text/thumbnails/draft, re-enables, drops its upload bar, and the quest's images dir gains exactly 2 files", async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guilds.createGuild({ name: 'Send Terminal State Guild', path: GUILD_PATH });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-send-terminal-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Send Terminal State Quest',
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
          id: 'e2e00000-0000-4000-8000-0000000000f7',
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
    const send = composerSendHarness({ page });
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

    const expectedBase64First = String(dataUrl1).slice(String(dataUrl1).indexOf(',') + 1);
    const expectedBase64Second = String(dataUrl2).slice(String(dataUrl2).indexOf(',') + 1);

    // Before-state: both stores hold real content, and the composer is visibly non-empty — the
    // control that stops the after-state checks below from passing vacuously against a store that
    // was already empty.
    expect(await composer.readDraftText()).toBe('A[Pasted Image 1]B[Pasted Image 2]');
    const draftImageRecordsBefore = await composer.readDraftImageRecords();
    expect(draftImageRecordsBefore.length).toBe(2);
    expect(await composer.readComposerTextContent()).toBe('AB');
    expect(await composer.readThumbnailCount()).toBe(2);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    await chatResponsePromise;

    // Text + thumbnails.
    expect(await composer.readComposerTextContent()).toBe('');
    expect(await composer.readThumbnailCount()).toBe(0);

    // Draft storage.
    expect(await composer.readDraftText()).toBe(null);
    expect(await composer.readDraftImageRecords()).toStrictEqual([]);

    // Re-enabled, once the turn has fully ended.
    await expect(page.getByTestId('SEND_BUTTON')).toBeEnabled({ timeout: PANEL_TIMEOUT });
    expect(await composer.readContentEditableAttribute()).toBe('true');

    // No stuck spinner.
    await expect(page.getByTestId('CHAT_INPUT_UPLOAD_PROGRESS')).toHaveCount(0);

    // Side-effect half: the message was not silently consumed — the quest's images dir holds
    // exactly the 2 files this send carried, as two DISTINCT files on disk (distinct inodes, not
    // the same file read twice), whose CONTENT is the two images this composer actually pasted —
    // a composer that cleared cleanly while the server received nothing (or different bytes) would
    // pass a count-only check while still silently dropping the message.
    const imagesDir = await send.readQuestImagesDir({ questFilePath: String(created.filePath) });
    const imagesDirSummary = {
      exists: imagesDir.exists,
      fileCount: imagesDir.fileNames.length,
      distinctInodeCount: new Set(imagesDir.ino).size,
      base64s: imagesDir.fileNames
        .map((fileName: unknown) =>
          send.readImageFileBase64({
            filePath: `${String(imagesDir.dirPath)}/${String(fileName)}`,
          }),
        )
        .map((value: unknown) => String(value))
        .sort(),
    };
    expect({
      exists: imagesDirSummary.exists,
      fileCount: imagesDirSummary.fileCount,
      distinctInodeCount: imagesDirSummary.distinctInodeCount,
    }).toStrictEqual({ exists: true, fileCount: 2, distinctInodeCount: 2 });
    expect(imagesDirSummary.base64s).toStrictEqual(
      [expectedBase64First, expectedBase64Second].sort(),
    );
  });
});
