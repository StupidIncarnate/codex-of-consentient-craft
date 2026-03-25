import { test, expect } from '@dungeonmaster/testing/e2e';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-approve';
const SPEC_PANEL_TIMEOUT = 5_000;
const PATCH_TIMEOUT = 3_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Quest Approve Button', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
    sessions.cleanSessionDirectory();
  });

  test('clicking APPROVE sends PATCH with next status transition', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'Approve Guild', path: GUILD_PATH });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const sessionId = `e2e-session-approve-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await createQuest({
      request,
      guildId,
      title: 'E2E Approve Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const questFolder = String(Reflect.get(created, 'questFolder'));
    const questFilePath = String(Reflect.get(created, 'filePath'));

    // Overwrite quest.json with desired status, work items, and flows
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: SPEC_PANEL_TIMEOUT });
    await expect(page.getByTestId('PANEL_HEADER')).toHaveText('FLOW APPROVAL');

    // Intercept the PATCH request to verify it sends the status transition
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes(`/api/quests/${questId}`),
      { timeout: PATCH_TIMEOUT },
    );

    await page.getByRole('button', { name: 'APPROVE' }).click();

    const patchRequest = await patchPromise;
    const body = patchRequest.postDataJSON();

    expect(body).toHaveProperty('status', 'flows_approved');
  });
});
