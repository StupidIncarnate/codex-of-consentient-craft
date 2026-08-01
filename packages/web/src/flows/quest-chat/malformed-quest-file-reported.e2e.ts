import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-malformed-quest-report';
const PANEL_TIMEOUT = 10_000;
const REVIEW_FLOWS = 'review_flows';

// Month 13 is not a month, so questContract's datetime rejects it. Comment createdAt is
// server-minted, so the product cannot author this — a hand-edited or older-schema file can.
const BAD_COMMENT_CREATED_AT = '2026-13-04T05:06:07.000Z';
// A non-comment field the contract also rejects. Seeded in a second test to prove the error surface
// belongs to quest loading in general, not to comments.
const BAD_STATUS = 'not_a_real_status';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Malformed quest.json is reported on the quest route', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('ERROR: {one comments entry with an impossible createdAt} => the read names the rejected field and the quest route renders QUEST_LOAD_ERROR instead of a blank workspace', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });

    const guild = await guilds.createGuild({ name: 'Malformed Comment Guild', path: GUILD_PATH });
    const created = await quests.createQuest({
      guildId: String(guilds.extractGuildId({ guild })),
      title: 'E2E Malformed Comment Quest',
      userRequest: 'Build the feature',
    });
    const questId = String(created.questId);

    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: REVIEW_FLOWS,
      workItems: [{ id: 'e2e00000-0000-4000-8000-000000000001', role: 'chaoswhisperer' }],
      comments: [
        {
          id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d101',
          flowId: 'harness-flow',
          nodeId: 'start',
          text: 'this one entry is enough to fail the whole read',
          createdAt: BAD_COMMENT_CREATED_AT,
        },
      ],
    });

    // Out-of-band: the read really does fail, and it fails naming the field rather than claiming the
    // quest was deleted. The DOM cannot show this, so it is checked over HTTP.
    const readResponse = await request.get(`/api/quests/${questId}`);
    const readBody = await readResponse.json();

    // The status carries the outcome — a body announcing failure under a 200 would let a caller
    // that only checks the status treat an unreadable quest as a readable one.
    expect(readResponse.status()).toBe(404);
    expect(String(readBody.error).split(': ').slice(-2).join(': ')).toBe(
      'comments.0.createdAt: Invalid datetime',
    );

    await navigationHarness({ page }).navigateToQuest({
      urlSlug: String(guilds.extractUrlSlug({ guild })),
      questId,
    });

    const loadError = page.getByTestId('QUEST_LOAD_ERROR');

    await expect(loadError).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(loadError).toContainText('UNREADABLE');
    // The reader is told WHICH field rejected, so the repair is a one-line edit rather than a hunt.
    await expect(page.getByTestId('QUEST_LOAD_ERROR_REASON')).toContainText(
      'comments.0.createdAt: Invalid datetime',
    );
    // The surfaces that read as "still loading" must be gone — that ambiguity is the whole bug.
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).toHaveCount(0);
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toHaveCount(0);
  });

  test('ERROR: {a non-comment field the contract rejects} => the same QUEST_LOAD_ERROR surface names that field', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });

    const guild = await guilds.createGuild({ name: 'Malformed Status Guild', path: GUILD_PATH });
    const created = await quests.createQuest({
      guildId: String(guilds.extractGuildId({ guild })),
      title: 'E2E Malformed Status Quest',
      userRequest: 'Build the feature',
    });
    const questId = String(created.questId);

    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: BAD_STATUS,
      workItems: [{ id: 'e2e00000-0000-4000-8000-000000000002', role: 'chaoswhisperer' }],
    });

    await navigationHarness({ page }).navigateToQuest({
      urlSlug: String(guilds.extractUrlSlug({ guild })),
      questId,
    });

    await expect(page.getByTestId('QUEST_LOAD_ERROR')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_LOAD_ERROR_REASON')).toContainText('status');
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).toHaveCount(0);
  });

  test('VALID: {a quest.json the contract accepts} => the workspace renders and no QUEST_LOAD_ERROR appears', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });

    const guild = await guilds.createGuild({ name: 'Healthy Quest Guild', path: GUILD_PATH });
    const created = await quests.createQuest({
      guildId: String(guilds.extractGuildId({ guild })),
      title: 'E2E Healthy Quest',
      userRequest: 'Build the feature',
    });
    const questId = String(created.questId);

    quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: REVIEW_FLOWS,
      workItems: [{ id: 'e2e00000-0000-4000-8000-000000000003', role: 'chaoswhisperer' }],
    });

    await navigationHarness({ page }).navigateToQuest({
      urlSlug: String(guilds.extractUrlSlug({ guild })),
      questId,
    });

    // The healthy control: without it, an error surface that painted on EVERY quest would pass the
    // two tests above.
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_LOAD_ERROR')).toHaveCount(0);
  });
});
