import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';

const GUILD_PATH = '/tmp/dm-e2e-pause-resume-matrix';
const HTTP_OK = 200;

// Derive iteration list from statics — NEVER hardcode. Per testing-patterns callout:
// one statics source drives both the iteration list AND subset-membership assertions.
type StatusKey = keyof typeof questStatusMetadataStatics.statuses;
const PAUSEABLE_STATUSES = (
  Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
).filter((s) => questStatusMetadataStatics.statuses[s].isPauseable);

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Pause/Resume Status Matrix (server-side roundtrip)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // Drive every isPauseable status through pause→resume via the HTTP API.
  // Some statuses have no UI pause surface (e.g. `created`, `pending`, `blocked`) — per
  // the directive, we still assert the server-side pausedAtStatus snapshot roundtrip
  // because the pause/resume endpoints are the backend contract regardless of which UI
  // element produces the mutation. UI-surface coverage is asserted by
  // `execution-panel-pause-button.spec.ts`, `chat-stop-pauses-quest.spec.ts`, and
  // `chat-send-auto-resumes.spec.ts`.
  for (const status of PAUSEABLE_STATUSES) {
    test(`VALID: {status: ${status}} => POST /pause sets pausedAtStatus=${status}; POST /resume restores status=${status}`, async ({
      request,
    }) => {
      const guilds = guildHarness({ request });
      const quests = questHarness({ request });
      const guild = await guilds.createGuild({
        name: `Pause Matrix ${status} Guild`,
        path: GUILD_PATH,
      });
      const guildId = guilds.extractGuildId({ guild });
      const sessionId = `e2e-matrix-${status}-${Date.now()}`;
      sessions.createSessionFile({ sessionId, userMessage: 'Build feature' });

      const created = await quests.createQuest({
        guildId: String(guildId),
        title: `Matrix ${status}`,
        userRequest: 'Build feature',
      });
      const { questId, questFolder } = created;
      const questFilePath = created.filePath;

      quests.writeQuestFile({
        questId: String(questId),
        questFolder: String(questFolder),
        questFilePath: String(questFilePath),
        status,
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-0000000000a1',
            role: 'chaoswhisperer',
            sessionId,
            status: 'complete',
          },
        ],
      });

      // Act: pause via server endpoint
      const pauseResponse = await request.post(`/api/quests/${questId}/pause`);

      expect(pauseResponse.status()).toBe(HTTP_OK);

      const pauseBody = await pauseResponse.json();

      expect(pauseBody).toStrictEqual({ paused: true });

      // Assert: quest is paused and pausedAtStatus snapshot equals the original status
      const afterPauseResponse = await request.get(`/api/quests/${questId}`);

      expect(afterPauseResponse.status()).toBe(HTTP_OK);

      const afterPauseBody = await afterPauseResponse.json();

      expect({
        status: afterPauseBody.quest.status,
        pausedAtStatus: afterPauseBody.quest.pausedAtStatus,
      }).toStrictEqual({ status: 'paused', pausedAtStatus: status });

      // Act: resume via server endpoint
      const resumeResponse = await request.post(`/api/quests/${questId}/resume`);

      expect(resumeResponse.status()).toBe(HTTP_OK);

      const resumeBody = await resumeResponse.json();

      expect(resumeBody).toStrictEqual({ resumed: true, restoredStatus: status });

      // Assert: quest.status is back to the original pre-pause status
      const afterResumeResponse = await request.get(`/api/quests/${questId}`);

      expect(afterResumeResponse.status()).toBe(HTTP_OK);

      const afterResumeBody = await afterResumeResponse.json();

      expect(afterResumeBody.quest.status).toBe(status);
    });
  }
});
