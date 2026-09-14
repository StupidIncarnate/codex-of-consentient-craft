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
import { composerSendHarness } from '../../../test/harnesses/composer-send/composer-send.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-screenshot-path-transcript';
const PANEL_TIMEOUT = 10_000;
const HTTP_OK = 200;
const SEED_WIDTH_PX = 16;
const SEED_HEIGHT_PX = 16;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
wireHarnessLifecycle({ harness: sessionHarness({ guildPath: GUILD_PATH }), testObj: test });
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('A typed screenshot path renders like any other pasted image', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
  });

  test('VALID: {a raw absolute screenshot path typed into the composer and sent, then the original file deleted} => the transcript bubble renders the image after a reload, and keeps rendering it after the source file is gone', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const send = composerSendHarness({ page });

    const seeded = images.seedImageFile({
      fileName: 'a-screenshot.png',
      widthPx: SEED_WIDTH_PX,
      heightPx: SEED_HEIGHT_PX,
      seed: 1,
    });
    const originalImagePath = String(seeded.imagePath);

    const guild = await guilds.createGuild({
      name: 'Screenshot Path Transcript Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    // Deliberately NO `sessions.createSessionFile` call: the work item below still carries this
    // `sessionId`, so the orchestrator still dispatches on the RESUME branch (`--resume <sessionId>`,
    // the plain "-p is just the rewritten message" shape every FACT/MIRROR here relies on) — but
    // because no session JSONL exists yet, the fake CLI's own `--resume` path (which only APPENDS,
    // never truncates) creates the file fresh with nothing in it but this test's own turn. A
    // pre-seeded 'Build feature' turn (the shape every OTHER composer-send mirror uses, where the
    // session already has history) would put a second, unrelated bubble ahead of this test's own
    // message in DOM order, and `transcriptImagesHarness.readBubbleChildren` reads the FIRST
    // `IMAGE_CONTENT_LAYER` on the page unconditionally — so a second bubble ahead of this one would
    // make it read the wrong bubble. Verified against a FRESH (no sessionId at all) spawn first: that
    // dispatches the whole ChaosWhisperer agent-bootstrap prompt instead of the raw message, which is
    // a different code path than this flow means to prove.
    const sessionId = `e2e-screenshot-path-transcript-${Date.now()}`;

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Screenshot Path Transcript Quest',
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
          id: 'e2e00000-0000-4000-8000-00000000f001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').click();
    await page.keyboard.type(`look ${originalImagePath} ok`);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    await expect
      .poll(() => claudeMock.readInvocations().length, { timeout: PANEL_TIMEOUT })
      .toBe(1);
    // `noUncheckedIndexedAccess` types a plain `[x] = array` destructure as `T | undefined` even once
    // `array` is a genuinely non-empty, concretely-typed array — reduce-with-no-initial-value is typed
    // `T` (never `T | undefined`) precisely because it throws at runtime on an empty array instead of
    // silently handing back `undefined`, which is a STRONGER guarantee than the destructure it
    // replaces, not a weaker one. The `.poll(...).toBe(N)` immediately above is what proves the array
    // is non-empty before this ever runs; reducing to the LAST element is "the newest invocation so
    // far", matching what `latest`/`firstInvocation`/`secondInvocation` each mean at their call site.
    const latest = claudeMock.readInvocations().reduce((_previous, invocation) => invocation);
    const tokens = send.readPromptImageTokens({ prompt: String(latest.prompt) });
    const copiedImagePath = String(tokens.paths[0]);
    // Precondition: the server actually rewrote the message into a token carrying a copied path —
    // proven here so a later failure below is about the UI render, never about the conversion itself.
    expect(copiedImagePath.length > 0).toBe(true);

    // The server-rewritten prompt only reaches the browser through the session transcript on disk —
    // Claude's --resume stream never echoes the prompt back — and subscribe-quest's replay already ran
    // at navigate time, so a reload is what delivers the fake CLI's appended `-p` prompt line.
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const expectedImageUrl = String(images.buildExpectedImageUrl({ imagePath: copiedImagePath }));

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'look ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'img', text: '', testId: 'CHAT_MESSAGE_IMAGE', src: expectedImageUrl },
      { tag: 'span', text: ' ok', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
    const bubbleText = await images.readBubbleText({ page });
    expect(bubbleText).toBe('look  ok');

    images.removeImageFile({ imagePath: originalImagePath });
    await page.reload();
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const imageCount = await page.getByTestId('CHAT_MESSAGE_IMAGE').count();
    const brokenCount = await page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN').count();
    const naturalWidth = await images.readNaturalWidth({ page, index: 0 });
    expect({ imageCount, brokenCount, naturalWidth }).toStrictEqual({
      imageCount: 1,
      brokenCount: 0,
      naturalWidth: SEED_WIDTH_PX,
    });
  });
});
