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

const GUILD_PATH = '/tmp/dm-e2e-composer-send-reload-race';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;
// Long enough that this test's own await-response-then-reload sequence (no artificial wait of its
// own) always lands well inside the window — the delayed browser-side 'load' delivery never
// actually fires in this test: the page is reloaded (and the pending setTimeout discarded with it)
// long before delayMs elapses. See DELAY_XHR_RESPONSE_DELIVERY_BROWSER_FN's own header for why this
// does not slow the test down.
const RESPONSE_DELIVERY_DELAY_MS = 5_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

// THE LOAD-BEARING REPRO: a real SEND, a real ACCEPTED response from the real server, and a real
// page.reload() that lands BEFORE this document's own JS is told the response arrived — the exact
// shape the brief describes ("the request itself was real and really reached the server", only
// XHR's load/loadend/readystatechange delivery was slow). A test that reloaded only after the
// response had already settled in this document would pass against the pre-fix code too (handleSend's
// `.then` would already have cleared the draft) and prove nothing; `delayXhrResponseDelivery` plus
// waiting on the REAL `page.waitForResponse` (a network-layer signal, unaffected by the client-side
// delivery delay) before reloading is what keeps the reload genuinely inside the window every time,
// not by luck of a fast loopback round trip.
test.describe('Composer send — a page reload racing an accepted response must not resurrect the draft', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {text + image sent, reload lands before this document learns the response arrived} => the composer restores empty, not the already-accepted message, and both draft stores are cleared', async ({
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
      name: 'Composer Send Reload Race Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-composer-send-reload-race-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Composer Send Reload Race Quest',
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

    // Must be registered BEFORE navigation — page.addInitScript only covers navigations that
    // happen after it is called.
    await send.delayXhrResponseDelivery({
      urlSuffix: `/api/quests/${questId}/chat`,
      delayMs: RESPONSE_DELIVERY_DELAY_MS,
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

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

    // The precondition this whole repro depends on: a real draft really is sitting in both stores
    // before the send, so an empty composer/store after reload below is a real clear, not a
    // no-op against content that was never there.
    expect(await composer.readDraftText()).toBe('A[Pasted Image 1]B');
    expect((await composer.readDraftImageRecords()).length).toBe(1);

    const chatResponsePromise = page.waitForResponse(
      (chatRes) =>
        chatRes.request().method() === 'POST' &&
        chatRes.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');

    // A REAL response, observed at the network layer — unaffected by this test's own client-side
    // delivery delay, which only defers the browser handing that response to xhrPostWithProgressAdapter's
    // JS listener. This is what proves the server genuinely accepted the message before the reload
    // below, matching the brief's own repro ("the request itself was real and really reached the
    // server").
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    // Reloads immediately — no wait of any kind — so this always lands well inside the
    // RESPONSE_DELIVERY_DELAY_MS window before handleSend's own `.then()` would ever have run in
    // this document.
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    // THE ASSERTION: the composer does not come back holding a message the server already has.
    expect(await composer.readComposerTextContent()).toBe('');
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
    expect(await composer.readDraftText()).toBe(null);
    expect(await composer.readDraftImageRecords()).toStrictEqual([]);
  });
});
