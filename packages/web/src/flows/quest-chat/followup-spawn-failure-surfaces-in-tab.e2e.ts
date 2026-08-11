import {
  AssistantTextStreamLineStub,
  SessionIdStub,
  SystemInitStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';

// Two guild paths, because guildAddBroker rejects a second guild registered on a path that is
// already taken — and the discriminating case below needs TWO quests alive at once, each recording
// its own missing worktree, to tell "names THIS failure" apart from "names A failure".
const GUILD_PATH_FIRST = '/tmp/dm-e2e-followup-spawn-failure-a';
const GUILD_PATH_SECOND = '/tmp/dm-e2e-followup-spawn-failure-b';

// Absolute, and deliberately never created. questCwdResolveBroker probes the recorded worktree for
// accessibility and chatSpawnBroker refuses the spawn when the probe fails, which is the
// `spawn-ok --"error"--> spawn-error` branch driven from a browser.
const FIRST_MISSING_WORKTREE = `${GUILD_PATH_FIRST}/worktrees/never-created-alpha`;
const SECOND_MISSING_WORKTREE = `${GUILD_PATH_SECOND}/worktrees/never-created-beta`;

const FIRST_QUESTION = 'Why did this quest stop before the verify tail drained?';
const SECOND_QUESTION = 'What actually landed on the branch?';
const ACCEPTED_QUESTION = 'Summarise what shipped in this quest.';
// Hostile member of the follow-up message input class: one unbroken token with no break
// opportunity, far past any sane line width. A spawn refusal that lost its reason to the payload —
// truncated, re-wrapped into a generic failure, or swallowed while the composer re-armed — renders
// something other than the exact string asserted beside it.
const HOSTILE_TOKEN_PAD = 160;
const HOSTILE_QUESTION = `worktree/packages/orchestrator/src/brokers/chat/spawn/chat-spawn-broker.ts:unbroken-token-with-no-break-opportunity-${'9'.repeat(HOSTILE_TOKEN_PAD)}`;

const ASSISTANT_REPLY = 'The ward run came back green on the last pass.';
const ACCEPTED_SESSION_ID = 'e2e-followup-spawn-ok-session-0000000000e1';

// The window a rejected POST has to travel back and render as a system entry. Generous because the
// browser round-trip goes out through the real route, into the orchestrator, and back.
const FAILURE_TIMEOUT = 8_000;
// Two full quest seeds (guild create, quest create, navigation, tab press, send) in ONE test does
// not fit the project's 10s default. test.setTimeout is lint-banned; a describe-level configure is
// the sanctioned lever.
const SUITE_TIMEOUT_MS = 60_000;

wireHarnessLifecycle({
  harness: environmentHarness({ guildPath: GUILD_PATH_FIRST }),
  testObj: test,
});
wireHarnessLifecycle({
  harness: environmentHarness({ guildPath: GUILD_PATH_SECOND }),
  testObj: test,
});
const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH_FIRST }),
  testObj: test,
});

test.describe('FOLLOW-UP spawn failure surfaces in the tab', () => {
  test.describe.configure({ timeout: SUITE_TIMEOUT_MS });

  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // spawn-failure-surfaces-in-tab, and the discriminating half of it. Both quests fail the SAME
  // way, so the only thing that separates their two failures is which worktree each one names —
  // which is exactly what "names the reason" claims. Each tab's read is an EXACT one-element list,
  // so the other quest's message being absent is asserted on a selector that is simultaneously
  // shown reaching that other message in the same test.
  test("ERROR: {two quests, each recording a different missing worktree} => each FOLLOW-UP tab renders its OWN missing worktree as the failure reason and never the other quest's", async ({
    page,
    request,
  }) => {
    const first = followupHarness({ page, request, guildPath: GUILD_PATH_FIRST });
    const firstQuest = await first.seedAndOpen({
      guildName: 'Spawn Failure Alpha Guild',
      status: 'blocked',
      worktreePath: FIRST_MISSING_WORKTREE,
    });

    await first.pressFollowup();
    await first.sendFollowupMessage({ text: FIRST_QUESTION });

    const firstFailure = `Cannot start chat for quest ${String(firstQuest.questId)}: worktree not found: ${FIRST_MISSING_WORKTREE}`;

    await expect
      .poll(async () => first.errorMessages(), { timeout: FAILURE_TIMEOUT })
      .toStrictEqual([firstFailure]);

    // "rather than showing a bare empty transcript": the user's own turn is on screen beside the
    // failure, so the tab is a conversation that reports why it stopped, not a blank panel.
    expect(await first.transcriptHasText({ text: FIRST_QUESTION })).toBe(true);

    const second = followupHarness({ page, request, guildPath: GUILD_PATH_SECOND });
    const secondQuest = await second.seedAndOpen({
      guildName: 'Spawn Failure Beta Guild',
      status: 'complete',
      worktreePath: SECOND_MISSING_WORKTREE,
    });

    await second.pressFollowup();
    await second.sendFollowupMessage({ text: SECOND_QUESTION });

    const secondFailure = `Cannot start chat for quest ${String(secondQuest.questId)}: worktree not found: ${SECOND_MISSING_WORKTREE}`;

    await expect
      .poll(async () => second.errorMessages(), { timeout: FAILURE_TIMEOUT })
      .toStrictEqual([secondFailure]);

    expect(await second.transcriptHasText({ text: SECOND_QUESTION })).toBe(true);
  });

  // The same terminal reached with a hostile payload. The failure text has to stay the spawn's
  // reason, not become a report about the message that happened to trigger it.
  test('EDGE: {missing worktree, message is one unbroken 200-character token} => the FOLLOW-UP tab still renders the exact spawn failure naming that worktree', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH_FIRST });
    const { questId } = await followup.seedAndOpen({
      guildName: 'Spawn Failure Hostile Guild',
      status: 'merged',
      worktreePath: FIRST_MISSING_WORKTREE,
    });

    await followup.pressFollowup();
    await followup.sendFollowupMessage({ text: HOSTILE_QUESTION });

    await expect
      .poll(async () => followup.errorMessages(), { timeout: FAILURE_TIMEOUT })
      .toStrictEqual([
        `Cannot start chat for quest ${String(questId)}: worktree not found: ${FIRST_MISSING_WORKTREE}`,
      ]);

    expect(await followup.transcriptHasText({ text: HOSTILE_QUESTION })).toBe(true);
  });

  // The non-vacuous partner for both absences above: the same errorMessages() read, on the same
  // surface, over a spawn that SUCCEEDS. Without this a typo'd selector would return [] forever and
  // every "and no other failure" assertion above would pass on nothing at all.
  test('VALID: {recorded worktree reachable} => the spawn is accepted and the FOLLOW-UP tab renders no error message at all', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH_FIRST });

    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({ value: ACCEPTED_SESSION_ID }),
        lines: [
          streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: { role: 'assistant', content: [{ type: 'text', text: ASSISTANT_REPLY }] },
            }),
          }),
        ],
      },
    });

    // No worktreePath at all, so questCwdResolveBroker takes its repo-root branch and resolves the
    // guild path's own fixture checkout — a real, reachable directory, which is what makes this the
    // contrast case rather than a second failure with a different message.
    await followup.seedAndOpen({ guildName: 'Spawn Success Guild', status: 'blocked' });

    await followup.pressFollowup();
    await followup.sendFollowupMessage({ text: ACCEPTED_QUESTION });

    // The transcript reaches non-empty on this surface…
    await expect(
      page.getByTestId('CHAT_PANEL').getByTestId('CHAT_MESSAGE').filter({
        hasText: ACCEPTED_QUESTION,
      }),
    ).toBeVisible({ timeout: FAILURE_TIMEOUT });

    // …and carries no failure, because nothing failed.
    expect(await followup.errorMessages()).toStrictEqual([]);
  });
});
