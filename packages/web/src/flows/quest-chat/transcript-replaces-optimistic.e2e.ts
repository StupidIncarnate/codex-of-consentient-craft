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
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-transcript-replaces-optimistic';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;
// The delivery path this spec rides is `quest-driven-watchers` (packages/server/src/responders/
// quest-driven-watchers/), the ONE live (no-reload) mechanism that stamps `sessionId` on a `user`
// role chat-output — the plain per-turn spawn stream (chatSpawnBroker/ChatStartResponder) never
// does, so its own entries always land in the SAME synthetic '__no_session__' bucket an optimistic
// entry does, where hasEquivalentChatEntryGuard's dedupe never even looks. quest-driven-watchers
// only opens a tail for a work item whose status is 'in_progress'
// (isActiveWorkItemStatusGuard) — see this file's own workItems below — and it reconciles either
// instantly (an outbox `quest-modified` event) or, worst case, on its 3s fallback poll
// (FALLBACK_RECONCILE_INTERVAL_MS), reading the WHOLE session file from byte 0 once it starts — so
// it catches this test's real send's newly-appended content regardless of exactly when it starts.
const TRANSCRIPT_WAIT_TIMEOUT = 15_000;
const HTTP_OK = 200;

// A token unlikely to appear anywhere else on the page (default UI copy, other seeded chat entries),
// so `.filter({ hasText })` against every CHAT_MESSAGE on the page can only ever match the ONE bubble
// this test cares about — both the optimistic copy and, later, its transcript replacement.
const MATCH_TEXT_BEFORE = 'TXSTART';
const MATCH_TEXT_AFTER = 'TXEND';
const MATCH_TEXT = `${MATCH_TEXT_BEFORE}${MATCH_TEXT_AFTER}`;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Transcript entry replaces the optimistic bubble it matches', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test('VALID: {paste-and-send a real image message, its transcript copy replays live via the quest-driven watcher} => the optimistic data: bubble is replaced in place by the transcript http: bubble — never duplicated alongside it', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const images = transcriptImagesHarness();

    const guild = await guilds.createGuild({
      name: 'Transcript Replaces Optimistic Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-transcript-replaces-optimistic-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Transcript Replaces Optimistic Quest',
      userRequest: 'Build feature',
    });
    const questId = String(created.questId);
    // status: 'in_progress' — not 'complete' — is load-bearing: quest-driven-watchers only opens a
    // persistent tail for a work item isActiveWorkItemStatusGuard calls active. `/api/quests/:id/chat`
    // itself has no status gate at all (it resolves by role + sessionId, since chat work items never
    // reach a terminal status), so this doesn't change how the send/resume behaves.
    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000aa',
          role: 'chaoswhisperer',
          sessionId,
          status: 'in_progress',
        },
      ],
    });

    claudeMock.queueResponse({ response: SimpleTextResponseStub({ sessionId, text: 'ack-1' }) });

    await nav.navigateToQuest({ urlSlug, questId });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    // Every recorder installed BEFORE the send, per this file's own authoring rule.
    const imagesRequests = images.recordImagesRequests({ page });
    await images.installTranscriptSequenceRecorder({ page, matchText: MATCH_TEXT });

    await composer.focusComposer();
    await page.keyboard.type(MATCH_TEXT_BEFORE);
    const dataUrl = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 5,
    });
    await composer.pasteImage({ dataUrl: String(dataUrl) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    await page.keyboard.type(MATCH_TEXT_AFTER);

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.keyboard.press('Enter');
    const chatResponse = await chatResponsePromise;
    expect(chatResponse.status()).toBe(HTTP_OK);

    const matchingBubbles = page.getByTestId('CHAT_MESSAGE').filter({ hasText: MATCH_TEXT });
    const matchingBubbleImage = matchingBubbles.locator('[data-testid="CHAT_MESSAGE_IMAGE"]');

    // branch:open-to-normalise + branch:origin-live + check-optimistic-shows-image-immediately: read
    // right after acceptance — exactly one bubble carries the message, its image is the in-memory
    // data URL (the "render-from-memory" branch, not the URL branch), and no GET for a served image
    // URL has fired yet.
    await expect(matchingBubbles).toHaveCount(1);
    const optimisticSrc = String(await matchingBubbleImage.getAttribute('src'));
    expect(optimisticSrc.startsWith('data:image/png;base64,')).toBe(true);
    expect(Number(imagesRequests.getCount())).toBe(0);

    // THE REAL, SERVER-MINTED PATH: pastedImagePersistBroker names every file from a fresh
    // crypto.randomUUID(), so this is the only way to learn what the actual send just wrote — and
    // therefore the only way to compute the EXACT served URL the transcript copy must resolve to.
    // The write sits inside the awaited chain the HTTP response comes from (persist happens before
    // the CLI is even spawned), so it is already on disk once chatResponsePromise resolved.
    const realImagePaths = await images.readQuestImagePaths({
      questFilePath: String(created.filePath),
    });
    expect(realImagePaths.length).toBe(1);
    const realImagePath = String(realImagePaths[0]);
    const expectedServedUrl = String(images.buildExpectedImageUrl({ imagePath: realImagePath }));

    // branch:origin-replay half one: wait for the transcript entry to actually land — proven by the
    // image src becoming the EXACT expected served URL, which can only become true once the
    // replacement has happened.
    await expect
      .poll(async () => matchingBubbleImage.getAttribute('src'), {
        timeout: TRANSCRIPT_WAIT_TIMEOUT,
      })
      .toBe(expectedServedUrl);

    // check-exactly-one-bubble: the count is read ONLY NOW, once the src poll above has already
    // proven the transcript entry landed — a count read taken before delivery would pass vacuously,
    // since the optimistic bubble alone already satisfies count 1.
    await expect(matchingBubbles).toHaveCount(1);

    // branch:origin-replay half two + check-surviving-bubble-uses-url: the surviving bubble's src is
    // the EXACT served URL, no element anywhere in the document still carries a data: src for this
    // message, and the GET for that exact URL really answered 200 with a real (non-zero) body — so
    // the URL is live, not merely present in the DOM.
    const survivingSrc = String(await matchingBubbleImage.getAttribute('src'));
    expect(survivingSrc).toBe(expectedServedUrl);
    await expect(page.locator('[data-testid="CHAT_MESSAGE_IMAGE"][src^="data:"]')).toHaveCount(0);

    await expect
      .poll(async () => imagesRequests.readResponseStatusFor({ url: survivingSrc }), {
        timeout: TRANSCRIPT_WAIT_TIMEOUT,
      })
      .toBe(HTTP_OK);
    const bodyLength = Number(
      await imagesRequests.readResponseBodyLengthFor({ url: survivingSrc }),
    );
    expect(bodyLength).toBeGreaterThan(0);

    // branch:memory-recheck: the RECORDED SEQUENCE is the only thing that can prove the ORDER — a
    // 'data:' sample strictly before an 'http:' sample for the first image src. A point-in-time read
    // (everything above) cannot tell a real recheck from a page that only ever rendered the final
    // state once.
    const rawSamples = await images.readTranscriptSequenceSamples({ page });
    const samples = rawSamples.map(
      (sample: { bubbleCount: unknown; firstImageSrcPrefix: unknown }) => ({
        bubbleCount: Number(sample.bubbleCount),
        firstImageSrcPrefix: String(sample.firstImageSrcPrefix),
      }),
    );
    const dataIndex = samples.findIndex((sample) => sample.firstImageSrcPrefix === 'data:');
    const httpIndex = samples.findIndex((sample) => sample.firstImageSrcPrefix === 'http:');
    expect(dataIndex !== -1 && httpIndex !== -1 && dataIndex < httpIndex).toBe(true);
  });
});
