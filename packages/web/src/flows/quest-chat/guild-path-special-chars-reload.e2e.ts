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

// Both a `.` and a `_` on purpose — the two characters the fake CLI's own encoding (before its
// fix) left untouched while claudePathSlugEncoderTransformer replaces every non-alphanumeric
// character alike.
const GUILD_PATH = '/tmp/dm-e2e-slug.encoding_check';
const HTTP_OK = 200;
const PANEL_TIMEOUT = 10_000;
const CHAT_TIMEOUT = 10_000;
const REPLY_TEXT = 'Slug encoding reply';

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

// THE BUG THIS EXISTS FOR. `bin/claude` (the fake Claude CLI) resolves its own session-JSONL
// directory from `process.cwd()` (the guild path, for an uncarved quest) the same way the real
// Claude CLI does — every non-alphanumeric character becomes its own `-`. A divergent encoding
// there writes a reply to a directory `chat-history-replay-broker` never reads. Streaming (the
// WebSocket path) never touches disk, so it hides the bug entirely; only a disk READ — a reload —
// can catch it, which is why this spec's real assertion comes AFTER `page.reload()`.
test.describe('A guild path carrying `.` and `_` resolves to the same session directory the fake CLI writes to', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {guild path has "." and "_", chat reply written by a real fake-CLI spawn} => the reply survives a reload', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Slug Encoding Check Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-slug-encoding-check-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Slug Encoding Check Quest',
      userRequest: 'Build feature',
    });
    const { questId, questFolder } = created;

    await quests.writeQuestFile({
      questId: String(questId),
      questFolder: String(questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      // 'complete', not 'in_progress': quest-driven-watchers opens a PERSISTENT tail for any
      // active work item (isActiveWorkItemStatusGuard) and this spec's own per-turn chat-spawn
      // stream would then deliver the same assistant line twice — once tagged with sessionId via
      // the watcher, once untagged via the direct spawn stream, landing in different dedup
      // buckets and rendering as two DOM nodes. 'complete' keeps this to the one delivery path
      // chat-send-auto-resumes.e2e.ts also relies on.
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000c1',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: REPLY_TEXT }),
    });

    await nav.navigateToQuest({ urlSlug, questId: String(questId) });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const chatResponsePromise = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' && res.url().endsWith(`/api/quests/${questId}/chat`),
    );
    await page.getByTestId('CHAT_INPUT').fill('Say hi');
    await page.getByTestId('SEND_BUTTON').click();
    const chatResponse = await chatResponsePromise;

    expect(chatResponse.status()).toBe(HTTP_OK);

    // Streaming delivers this over the WebSocket, so seeing it here proves nothing about WHERE on
    // disk the fake CLI wrote the reply.
    await expect(page.getByText(REPLY_TEXT)).toBeVisible({ timeout: CHAT_TIMEOUT });

    // THE REGRESSION GUARD: a reload throws away the live stream and re-reads the session from
    // disk via chat-history-replay-broker, which resolves the directory through
    // claudePathSlugEncoderTransformer. If the fake CLI encoded GUILD_PATH differently, the reply
    // it just wrote sits in a directory nobody reads, and this text disappears.
    await page.reload();
    await expect(page.getByText(REPLY_TEXT)).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
