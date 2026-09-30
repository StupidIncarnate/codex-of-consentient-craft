import { GuildPathStub } from '@dungeonmaster/shared/contracts/guild-path/guild-path.stub';
import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
} from '@dungeonmaster/shared/contracts/assistant-stream-line/assistant-stream-line.stub';
import { UserTextStringStreamLineStub } from '@dungeonmaster/shared/contracts/user-text-stream-line/user-text-stream-line.stub';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';

const GUILD_PATH = GuildPathStub({ value: '/tmp/dm-e2e-worker-subagent-reaches-own-row' });
const PANEL_TIMEOUT = 10_000;
const NO_CHAIN_TIMEOUT = 3_000;
// quest-monitor-jsonl-watcher-broker's own subagents-dir re-scan is a 1s poll, plus whatever the
// reconcile-watchers loop takes to start tailing this session at all — CHAIN_TIMEOUT gives both
// room without ever sleeping a fixed duration.
const CHAIN_TIMEOUT = 20_000;

const WORKER_SESSION_ID = 'e2e-worker-subagent-reaches-own-row-001';
const SUBAGENT_AGENT_ID = 'e2eworkersubagentreachesrow01';
const TASK_TOOL_USE_ID = 'toolu_e2e_worker_subagent_reaches_own_row';
const OP_ID = '00000000-0000-4000-8000-0000d7000001';
const WI_ID = 'e2e00000-0000-4000-8000-0000d7000001';
const ROW_TEXT = 'codeweaver: worker dispatches its own sub-agent';
const TASK_PROMPT = 'Refactor the widget exactly per the operation scope';
const SUBAGENT_DISTINCT_TEXT =
  'Sub-agent reporting under its dispatching worker row, not the chat panel.';

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe("A worker's own Task sub-agent streams live under that worker's own execution row", () => {
  test.describe.configure({ timeout: 45_000 });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {worker work item with sessionId Task-dispatches a sub-agent whose JSONL appears on disk} => the sub-agent chain renders live inside that SAME execution row, carrying its distinctive text', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Worker Subagent Reaches Own Row Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    // The worker's own main session JSONL, pre-existing with only its kickoff line — no Task line
    // yet. The Task fires LIVE below, after the browser has already subscribed, which is what
    // proves this exercises the live watcher's own scan-subagents-dir pairing rather than
    // subscribe-quest's one-shot replay (subagent-duration-row-status-gate.e2e.ts's own precedent
    // for that replay path pre-seeds everything before navigating).
    await sessions.createSessionFile({
      sessionId: WORKER_SESSION_ID,
      userMessage: 'Kick off the worker session',
    });

    const created = await quests.createQuest({
      guildId: guildId,
      title: 'Worker Subagent Reaches Own Row Quest',
      userRequest: 'Build the feature',
    });
    await quests.writeQuestFile({
      questId: created.questId,
      questFolder: created.questFolder,
      questFilePath: String(created.filePath),
      status: 'in_progress',
      operations: [{ id: OP_ID, role: 'codeweaver', text: ROW_TEXT, status: 'in_progress' }],
      workItems: [
        {
          id: WI_ID,
          role: 'codeweaver',
          status: 'in_progress',
          sessionId: WORKER_SESSION_ID,
          relatedDataItems: [`operations/${OP_ID}`],
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId: created.questId });

    const executionPanel = page.getByTestId('execution-panel-widget');
    await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    const workerRow = executionPanel
      .getByTestId('execution-row-layer-widget')
      .filter({ hasText: ROW_TEXT });
    await expect(workerRow).toBeVisible({ timeout: PANEL_TIMEOUT });
    // No chain yet — the Task has not fired, so nothing has been paired into this row.
    await expect(workerRow.getByTestId('SUBAGENT_CHAIN')).toHaveCount(0, {
      timeout: NO_CHAIN_TIMEOUT,
    });

    // The worker dispatches a Task, live, on its OWN session file — appended after the browser has
    // already subscribed to the quest.
    await sessions.appendMainSessionLine({
      sessionId: WORKER_SESSION_ID,
      line: JSON.stringify(
        AssistantTaskToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: TASK_TOOL_USE_ID,
                name: 'Agent',
                input: {
                  description: 'Sub-agent work for the worker row',
                  prompt: TASK_PROMPT,
                  subagent_type: 'general-purpose',
                },
              },
            ],
          },
        }),
      ),
    });

    // Claude CLI writes the sub-agent's own file the moment the Task spawns: line 0 is the prompt
    // VERBATIM (byte-identical to the Task's own input.prompt above) — the one field
    // scan-subagents-dir-layer-broker's live pairing reads to correlate the two. There is no
    // completion tool_result line anywhere on the main session, so the replay broker's own
    // pass-1a/1b correlation (chat-history-replay-broker) never fires for this file; only the live
    // watcher's own `pairSubagentByPrompt` can route it.
    await sessions.createSubagentTailMultiEntry({
      sessionId: WORKER_SESSION_ID,
      agentId: SUBAGENT_AGENT_ID,
      lines: [
        JSON.stringify(
          UserTextStringStreamLineStub({ message: { role: 'user', content: TASK_PROMPT } }),
        ),
        JSON.stringify(
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: SUBAGENT_DISTINCT_TEXT }],
            },
          }),
        ),
      ],
    });

    // The in_progress row auto-expands once its chain's entries arrive — no click needed, same
    // shape as the running row in subagent-duration-row-status-gate.e2e.ts. Scoping both checks to
    // workerRow is what proves the chain (and its distinctive text) landed INSIDE this worker's own
    // row rather than merged into some other bucket.
    await expect(workerRow.getByTestId('SUBAGENT_CHAIN')).toBeVisible({ timeout: CHAIN_TIMEOUT });
    await expect(workerRow.getByText(SUBAGENT_DISTINCT_TEXT)).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
  });
});
