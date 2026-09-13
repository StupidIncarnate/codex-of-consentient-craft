import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';

import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { subagentDurationHarness } from '../../../test/harnesses/subagent-duration/subagent-duration.harness';

const GUILD_PATH = '/tmp/dm-e2e-subagent-duration-session-blank';
const HTTP_OK = 200;
const CHAIN_TIMEOUT = 10_000;

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
const subagentDuration = subagentDurationHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: subagentDuration, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A session-transcript sub-agent chain with no landed completion notification renders no duration figure', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {two sibling sub-agent chains seeded with an IDENTICAL Task tool-use timestamp, one followed by a landed completion notification and one with none} => the un-notified chain renders its header and body with no duration figure, while its notified sibling — same start — reads a real duration figure', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Subagent Duration Session Blank Pair Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    // Both chains share this exact Task tool-use timestamp — the pair's whole point is that the
    // only thing distinguishing them on screen is whether a notification landed.
    const TASK_TOOL_USE_AT = '2026-09-10T04:00:00.000Z';
    const NO_NOTIF_SESSION_ID = 'e2e-sd-blank-no-notif';
    const NOTIF_SESSION_ID = 'e2e-sd-blank-notif';
    const NO_NOTIF_DESCRIPTION = 'Sub-agent work with no notification landed';
    const NOTIF_DESCRIPTION = 'Sub-agent work with a landed notification';

    subagentDuration.seedChain({
      sessionId: NO_NOTIF_SESSION_ID,
      agentId: 'blanknonotifagent',
      taskToolUseId: 'toolu_blank_no_notif',
      taskDescription: NO_NOTIF_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
    });
    subagentDuration.seedChain({
      sessionId: NOTIF_SESSION_ID,
      agentId: 'blanknotifagent',
      taskToolUseId: 'toolu_blank_notif',
      taskDescription: NOTIF_DESCRIPTION,
      taskToolUseAt: TASK_TOOL_USE_AT,
      notification: { at: '2026-09-10T04:04:30.000Z', durationMs: 270_000 },
    });

    await page.goto(`/${guildId}/session/${NO_NOTIF_SESSION_ID}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const noNotifHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    // subagent-duration-session-view:observable:check-session-running-chain-blank and
    // subagent-duration-session-view:branch:session-notification-no — this chain HAS a Task
    // tool-use timestamp (yes-start) and lands no notification, so its count of 0 is the "no"
    // outcome, read against its notified sibling's count of 1 further down this same test.
    await expect(noNotifHeader).toBeVisible({ timeout: CHAIN_TIMEOUT });
    await expect(noNotifHeader).toContainText(NO_NOTIF_DESCRIPTION, { timeout: CHAIN_TIMEOUT });
    await expect(page.getByTestId('subagent-chain-duration')).toHaveCount(0, {
      timeout: CHAIN_TIMEOUT,
    });

    // subagent-duration-session-view:terminal:session-no-duration — the chain stays intact
    // beside the absent figure: a positive entry count, never "0 entries", and the seeded body
    // marker still rendered inside the chain's own scope.
    await expect(noNotifHeader).toContainText('1 entries', { timeout: CHAIN_TIMEOUT });
    await expect(page.getByTestId('SUBAGENT_CHAIN')).toContainText('Sub-agent work body', {
      timeout: CHAIN_TIMEOUT,
    });

    await page.goto(`/${guildId}/session/${NOTIF_SESSION_ID}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const notifHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(notifHeader).toBeVisible({ timeout: CHAIN_TIMEOUT });
    await expect(notifHeader).toContainText(NOTIF_DESCRIPTION, { timeout: CHAIN_TIMEOUT });

    const notifDuration = page.getByTestId('subagent-chain-duration');

    // subagent-duration-session-view:branch:session-notification-yes — this chain's count of 1,
    // read against the un-notified sibling's count of 0 already read above in this same test.
    await expect(notifDuration).toHaveCount(1, { timeout: CHAIN_TIMEOUT });

    // subagent-duration-session-view:branch:session-yes-start — the identical start DID route
    // into the notification decision: the figure is the real band the notified chain's own
    // reportedDurationMs crosses (270000ms => "4m"), not a placeholder or a copy of the sibling's
    // absence.
    await expect(notifDuration).toHaveText('4m', { timeout: CHAIN_TIMEOUT });
  });

  test('EMPTY: {session transcript holding an assistant text reply and no Task tool-use line at all} => renders SUBAGENT_CHAIN count 0 and subagent-chain-duration count 0', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Subagent Duration Session Blank No Task Line Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const NO_TASK_SESSION_ID = 'e2e-sd-blank-no-task-line';
    const ASSISTANT_TEXT = 'No sub-agent was ever dispatched for this reply.';

    sessions.createSessionWithAssistantText({
      sessionId: NO_TASK_SESSION_ID,
      text: ASSISTANT_TEXT,
    });

    await page.goto(`/${guildId}/session/${NO_TASK_SESSION_ID}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Confirms the transcript actually finished loading before the two counts below are trusted
    // as a real "never renders" rather than "checked before the page painted".
    await expect(page.getByText(ASSISTANT_TEXT)).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // subagent-duration-session-view:branch:session-no-start — this is the NEAREST REAL
    // condition, not the spec's literal branch. collect-subagent-chains-transformer.ts:152 sets
    // `taskToolUse: entry` unconditionally off an already-matched Task tool-use, and
    // chat-entry-contract.ts:39 makes `timestamp` required and non-nullable on every ChatEntry
    // variant, so no real transcript can produce a chain whose Task tool-use timestamp is
    // missing. A transcript with no Task tool-use line at all is the closest reachable substitute:
    // no chain is ever collected, so both counts read 0 — while this file's other test shows both
    // non-zero on the same two selectors, which is what rules out a broken selector here.
    await expect(page.getByTestId('SUBAGENT_CHAIN')).toHaveCount(0, { timeout: CHAIN_TIMEOUT });
    await expect(page.getByTestId('subagent-chain-duration')).toHaveCount(0, {
      timeout: CHAIN_TIMEOUT,
    });
  });
});
