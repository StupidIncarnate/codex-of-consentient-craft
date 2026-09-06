import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';

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
  // `execution-panel-pause-button.e2e.ts`, `chat-stop-pauses-quest.e2e.ts`, and
  // `chat-send-auto-resumes.e2e.ts`.
  for (const status of PAUSEABLE_STATUSES) {
    // A feature quest can only rest at `approved` with a codeweaver operation on its ledger
    // (hasQuestGateContentGuard). Resume restores paused → approved, which re-runs that gate, so
    // the approved case must seed one. Every other pauseable status is ungated on this axis, so an
    // empty ledger (writeQuestFile's default) keeps those cases identical.
    const operations =
      status === 'approved'
        ? [
            {
              id: '00000000-0000-4000-8000-0000000000c1',
              role: 'codeweaver',
              text: 'core: build the feature',
              status: 'pending',
            },
          ]
        : [];

    // A quest only RESTS at a status the derivation owns while something on it is unfinished.
    // `isAnyAgentRunning` marks exactly the two pauseable statuses `workItemsToQuestStatusTransformer`
    // acts on (`in_progress`, `merging`); every other one it returns unchanged, which is why every
    // other case here passes with a finished work item. For those two, a quest whose work items are
    // all terminal and whose ledger is drained genuinely IS `complete` (or `merged`), so the
    // orchestration-loop pass `OrchestrationResumeResponder` kicks off derives that and writes it
    // moments after the restore lands — the restore is correct and then correctly superseded. Giving
    // the intake session a non-terminal status is what makes the fixture describe the state its
    // status claims, so there is a restored status left to read back.
    //
    // It stays a CHAT role deliberately, and the ledger stays drained. `hasIncompleteQuestWorkGuard`
    // — which the resume responder consults to decide whether to switch the GLOBAL dispatcher on —
    // excludes chat work items outright and counts every undrained operation item, so a live intake
    // session is the ONE shape that holds the quest off a terminal derivation while keeping
    // `dispatch.started: false` below. A non-chat work item or a pending operation would flip that
    // guard and start the queue across every other quest in the suite.
    const workItemStatus = questStatusMetadataStatics.statuses[status].isAnyAgentRunning
      ? 'in_progress'
      : 'complete';

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
        operations,
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-0000000000a1',
            role: 'chaoswhisperer',
            sessionId,
            status: workItemStatus,
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

      // Every fixture here carries a drained ledger and no work item the dispatcher would pick up
      // (a chat-role item never counts — see `hasIncompleteQuestWorkGuard`), so resume leaves the
      // GLOBAL dispatcher alone — starting it would do nothing for this quest and would reach
      // across every other quest in the suite.
      expect(resumeBody).toStrictEqual({
        resumed: true,
        restoredStatus: status,
        dispatch: { started: false, reason: 'quest has no dispatchable work' },
      });

      // Assert: quest.status is back to the original pre-pause status
      const afterResumeResponse = await request.get(`/api/quests/${questId}`);

      expect(afterResumeResponse.status()).toBe(HTTP_OK);

      const afterResumeBody = await afterResumeResponse.json();

      expect(afterResumeBody.quest.status).toBe(status);
    });
  }
});
