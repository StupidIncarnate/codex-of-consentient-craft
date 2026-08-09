import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { followupHarness } from '../../../test/harnesses/followup/followup.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { SessionIdStub } from '@dungeonmaster/shared/contracts';

const GUILD_PATH = '/tmp/dm-e2e-followup-tab-bar';
const PANEL_TIMEOUT = 10_000;

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('FOLLOW-UP tab bar structure', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // execution-first-without-followup: before any FOLLOW-UP press the bar carries the two
  // baseline tabs only, EXECUTION active. This is the two-tab baseline nobody pinned before the
  // third tab was added — a suite that starts every other case AFTER pressing FOLLOW-UP would
  // never notice this baseline regress.
  test('VALID: {blocked quest, before pressing FOLLOW-UP} => tab bar renders [EXECUTION, QUEST SPEC] with EXECUTION active', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    await followup.seedAndOpen({ guildName: 'Tab Bar Baseline Guild', status: 'blocked' });

    const order = await followup.tabOrder();

    expect(order).toStrictEqual(['execution-panel-tab-execution', 'execution-panel-tab-spec']);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-execution' })).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-spec' })).toBe(false);
  });

  // followup-tab-appears + branch fc-tab-no (tab-open -> "no" -> open-followup-tab, the
  // first-ever press). Order is asserted as the COMPLETE three-element list, never membership —
  // a FOLLOW-UP tab appended at the END would satisfy "is present" while failing this.
  test('VALID: {press FOLLOW-UP for the first time} => tab bar renders [FOLLOW-UP, EXECUTION, QUEST SPEC] with FOLLOW-UP active, and mounts ChatPanelWidget', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    await followup.seedAndOpen({ guildName: 'Tab Bar Appear Guild', status: 'blocked' });

    await followup.pressFollowup();

    const order = await followup.tabOrder();

    expect(order).toStrictEqual([
      'execution-panel-tab-followup',
      'execution-panel-tab-execution',
      'execution-panel-tab-spec',
    ]);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-followup' })).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-execution' })).toBe(false);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-spec' })).toBe(false);

    // chat-panel-widget-mounted: the SAME widget the spec-phase chat mounts, with its composer.
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible();

    // summary-stays-on-right: opening FOLLOW-UP fully replaces the LEFT panel's content; the
    // right-hand activity column (and the quest summary inside it) must be untouched by that.
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).toBeVisible();
    await expect(
      page.getByTestId('QUEST_CHAT_ACTIVITY').getByTestId('QUEST_SUMMARY'),
    ).toBeVisible();
  });

  // second-press-switches-only + second-press-keeps-transcript + followup-tab-persists-on-execution
  // + branch fc-tab-yes (tab-open -> "yes" -> switch-existing-tab). Two DISTINCT messages sent
  // before switching away, so "the right one persisted" and "the first one persisted" are
  // different claims a swap bug could fail independently.
  test('VALID: {send two messages, switch to EXECUTION, press FOLLOW-UP again} => exactly one FOLLOW-UP tab, still listed first, still active, both messages still rendered', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    await followup.seedAndOpen({ guildName: 'Tab Bar Second Press Guild', status: 'blocked' });

    const sessionId = SessionIdStub({ value: 'e2e-followup-tabbar-session-0000000000a1' });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Reply to the first question' }),
    });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Reply to the second question' }),
    });

    await followup.pressFollowup();

    await page.getByTestId('CHAT_INPUT').fill('What blocked this quest the first time?');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'What blocked this quest the first time?' }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await page.getByTestId('CHAT_INPUT').fill('And what fixed it on retry?');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(
      page.getByTestId('CHAT_MESSAGE').filter({ hasText: 'And what fixed it on retry?' }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    await followup.switchToExecutionTab();

    // followup-tab-persists-on-execution: still listed first while EXECUTION is the active tab.
    const orderWhileOnExecution = await followup.tabOrder();

    expect(orderWhileOnExecution).toStrictEqual([
      'execution-panel-tab-followup',
      'execution-panel-tab-execution',
      'execution-panel-tab-spec',
    ]);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-execution' })).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-followup' })).toBe(false);

    await followup.switchToFollowupTab();

    // second-press-switches-only: pressing FOLLOW-UP again never mints a second tab.
    expect(await followup.hasExactlyOneFollowupTab()).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-followup' })).toBe(true);

    // second-press-keeps-transcript: BOTH prior messages are still rendered, not just the latest.
    // Each filter also excludes the tavernkeeper PROMPT echo: the session's opening turn is the
    // whole agent prompt, delivered as a user message, and it quotes the user's own question
    // back — so a bare hasText filter resolves to two CHAT_MESSAGE elements and trips Playwright
    // strict mode. hasNotText pins each assertion to the user's own turn.
    await expect(
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'What blocked this quest the first time?' })
        .filter({ hasNotText: '# Tavernkeeper - Follow-Up' }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'And what fixed it on retry?' })
        .filter({ hasNotText: '# Tavernkeeper - Follow-Up' }),
    ).toBeVisible();
  });

  // followup-tab-survives-status-change: the tab is gated on HAVING BEEN OPENED, never on quest
  // status. A blocked quest moving to merging removes the post-quest bar (merging is not
  // followup-chatable) but must not touch the already-open tab or its transcript — this is the
  // only surface `followup-rejection-shown-in-tab` can later be observed on, since a tab that
  // closed on status change would take the error text down with it.
  test('VALID: {FOLLOW-UP tab open with a sent message, quest moves blocked -> merging} => tab stays first with its transcript intact while the post-quest bar disappears', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    const quests = questHarness({ request });
    const { questId } = await followup.seedAndOpen({
      guildName: 'Tab Bar Status Survival Guild',
      status: 'blocked',
    });

    const sessionId = SessionIdStub({ value: 'e2e-followup-tabbar-survival-0000000000a2' });
    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ sessionId, text: 'Noted before the merge kicked off' }),
    });

    await followup.pressFollowup();
    await page.getByTestId('CHAT_INPUT').fill('Why did we block here?');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(
      page.getByTestId('CHAT_MESSAGE').filter({ hasText: 'Why did we block here?' }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The post-quest bar renders at the foot of the EXECUTION tab, and FOLLOW-UP is the active
    // tab right now — so the bar is only observable from across the tab bar. Switch to read it,
    // then switch back, so the rest of this test still observes the tab it is actually about.
    await followup.switchToExecutionTab();
    expect(await followup.postQuestBarVisible()).toBe(true);
    await followup.switchToFollowupTab();

    // Precondition write only — the quest's status is not the control under test here (that is
    // warpgate's own route); this merely sets up the state the tab must survive.
    await quests.patchQuestStatus({ questId: String(questId), status: 'merging' });

    // Read the bar's DISAPPEARANCE from the EXECUTION tab too. Asserting its absence while the
    // FOLLOW-UP tab is active would pass even with the bar fully intact, since the execution
    // column is unmounted either way — and the same selector was just shown visible on this
    // exact surface, which is what keeps this negative from being vacuous.
    await followup.switchToExecutionTab();
    await expect(page.getByTestId('execution-panel-post-quest-bar')).not.toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await followup.switchToFollowupTab();

    const orderAfterStatusChange = await followup.tabOrder();

    expect(orderAfterStatusChange[0]).toBe('execution-panel-tab-followup');
    await expect(
      page.getByTestId('CHAT_MESSAGE').filter({ hasText: 'Why did we block here?' }),
    ).toBeVisible();
  });
});
