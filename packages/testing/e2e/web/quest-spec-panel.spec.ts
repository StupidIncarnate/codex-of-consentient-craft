import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-spec-panel';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Quest Spec Panel', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: session with linked quest shows spec panel instead of awaiting message', async ({
    page,
    request,
  }) => {
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const guild = await guildHarness({ request }).createGuild({
      name: 'Spec Panel Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);

    const sessionId = `e2e-session-spec-${Date.now()}`;
    sessions.createSessionFile({
      sessionId,
      userMessage: 'Build the feature',
    });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Spec Panel Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    // Overwrite quest.json with desired test data
    quests.writeQuestFile({
      questId: String(questId),
      questFolder,
      questFilePath,
      status: 'approved',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          sessionId,
        },
      ],
    });

    // Navigate directly to session page and wait for guild + session data to load
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');
    await nav.navigateToSession({ urlSlug, sessionId });

    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();

    // The spec panel should render instead of the "Awaiting quest activity..." text
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Awaiting quest activity...')).not.toBeVisible();
  });
});
