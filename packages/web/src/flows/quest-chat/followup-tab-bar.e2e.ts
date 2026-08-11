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
// A tavernkeeper turn ends on the spawned child's exit, which is a process lifecycle rather than a
// render — measured at up to ~20s here — so the composer's return to SEND gets its own budget
// instead of the render-scale PANEL_TIMEOUT every DOM assertion in this file uses.
const TURN_END_TIMEOUT = 40_000;
// The tavernkeeper session's opening turn is the whole agent prompt, delivered as a user message,
// and it quotes the user's own question back. So a bare `hasText` filter on any question this spec
// types resolves to TWO CHAT_MESSAGE elements once that turn replays, and Playwright strict mode
// fails the assertion. Every question filter here pairs with this exclusion to pin the user's own
// turn — the prompt echo arrives asynchronously, so an unguarded filter passes or fails on timing.
const TAVERNKEEPER_PROMPT_HEADING = '# Tavernkeeper - Follow-Up';

const claudeMock = wireHarnessLifecycle({
  harness: claudeMockHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('FOLLOW-UP tab bar structure', () => {
  // The config-wide 10s per-test budget is a render-scale number. Two of these cases send a real
  // follow-up message and wait for the spawned tavernkeeper child to EXIT before sending the next
  // one, which is process-scale — under the 10s default the whole test is killed mid-wait and the
  // failure surfaces as whichever locator happened to be pending, which is what made this file read
  // as a UI defect rather than a budget that was never big enough for what the case does.
  test.describe.configure({ timeout: 90_000 });

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
  // + composer-live-for-next-turn + edge fc-reply-next-turn (stream-reply -> "user replies" ->
  // send-followup-message: the second message is only reachable once the first turn has ended, so
  // the SEND_BUTTON wait below is the transition and the second message rendering is its landing).
  // Two DISTINCT messages sent before switching away, so "the right one persisted" and "the first
  // one persisted" are different claims a swap bug could fail independently. The tab-open decision
  // itself is NOT driven here — this case returns to the tab by clicking the TAB, which is a
  // different control; the FOLLOW-UP button's second press has its own case below.
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
        .filter({ hasText: 'What blocked this quest the first time?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The first turn must END before the second is typed, and the composer is what says so.
    // Waiting for SEND alone is not enough: SEND is still painted in the window between the
    // click and useQuestChatBinding arming isStreaming, so that wait passes while the turn is
    // in flight, the second send lands in a disabled composer, and its user entry never renders.
    // So wait for STOP to APPEAR (the turn is genuinely armed) and only then for it to go —
    // that pair is the transition. It is read off the composer rather than off the reply text
    // because a turn ends whether or not its reply reached this transcript, and the tavernkeeper
    // reply's arrival is not ordered against the turn ending.
    await expect(page.getByTestId('STOP_BUTTON')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('STOP_BUTTON')).not.toBeVisible({ timeout: TURN_END_TIMEOUT });
    // STOP going is not on its own proof the composer came back: the control that replaces it is
    // what the next message is typed into, and the failure this guards against left the panel
    // mounted with NEITHER control while the agent's post-exit transcript drained.
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible({ timeout: TURN_END_TIMEOUT });
    await page.getByTestId('CHAT_INPUT').fill('And what fixed it on retry?');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'And what fixed it on retry?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
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
    await expect(
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'What blocked this quest the first time?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
    ).toBeVisible();
    await expect(
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'And what fixed it on retry?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
    ).toBeVisible();

    // ONE rendered message per message SENT. A tavernkeeper turn's transcript is read by several
    // readers of the same session JSONL at once — the spawn's own stdout, its post-exit
    // main-session tail, and the quest-driven session watcher — and the only thing collapsing
    // those copies is that every reader keys the entry on the stream line's own uuid. A second
    // copy here is therefore a reader whose lines were keyed on something else, which a person
    // reading this tab sees as their own question typed twice. Counted explicitly because
    // `toBeVisible` retries until it passes: it reports green on a transcript whose duplicate
    // simply had not landed yet, and green is exactly what the duplicate looks like on arrival.
    expect(
      await page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'And what fixed it on retry?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING })
        .count(),
    ).toBe(1);
  });

  // branch fc-tab-yes (tab-open -> "yes" -> switch-existing-tab), driven through the FOLLOW-UP
  // BUTTON a second time rather than by clicking the tab. The button is the only entry into the
  // tab-open decision at all, so a case that reaches the tab by clicking the tab exercises tab
  // switching — a different control — and never puts the decision's "already open" side under
  // test. Asserted as the complete three-element order plus a count of one, so a second press
  // that appended another FOLLOW-UP tab fails here rather than passing an is-present check.
  test('VALID: {press FOLLOW-UP, switch to EXECUTION, press the FOLLOW-UP button again} => still exactly one FOLLOW-UP tab, still listed first, and active again', async ({
    page,
    request,
  }) => {
    const followup = followupHarness({ page, request, guildPath: GUILD_PATH });
    await followup.seedAndOpen({
      guildName: 'Tab Bar Second Button Press Guild',
      status: 'blocked',
    });

    await followup.pressFollowup();
    await followup.switchToExecutionTab();

    // The precondition the "yes" side needs: the tab EXISTS and is NOT the active one, so
    // "switched to it" below is a real transition rather than a state that never changed.
    expect(await followup.hasExactlyOneFollowupTab()).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-execution' })).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-followup' })).toBe(false);

    await followup.pressFollowup();

    expect(await followup.hasExactlyOneFollowupTab()).toBe(true);
    expect(await followup.tabOrder()).toStrictEqual([
      'execution-panel-tab-followup',
      'execution-panel-tab-execution',
      'execution-panel-tab-spec',
    ]);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-followup' })).toBe(true);
    expect(await followup.isTabActive({ testid: 'execution-panel-tab-execution' })).toBe(false);
  });

  // followup-tab-survives-status-change: the tab is gated on HAVING BEEN OPENED, never on quest
  // status. A blocked quest moving to abandoned removes the post-quest bar (abandoned is neither
  // followup-chatable nor mergeable) but must not touch the already-open tab or its transcript —
  // this is the only surface `followup-rejection-shown-in-tab` can later be observed on, since a
  // tab that closed on status change would take the error text down with it. That sibling spec
  // drives `abandoned` too, as one of the statuses it derives a rejection case for, so the two
  // agree on which move a reader can actually make out from under an open tab.
  //
  // `abandoned` is the move this case can hold still at. It is a legal transition from `blocked`
  // (`questStatusTransitionsStatics.blocked`) and it is one of the statuses
  // `work-items-to-quest-status-transformer` returns unchanged, so no later write can move it.
  // That matters here because this case sends a real follow-up message: the tavernkeeper's own
  // `onComplete` marks its work item complete, and a work-item write with no explicit status
  // re-derives the quest's. A status that derives onward (`merging` becomes `merged` once the
  // work items are terminal and the ledger is drained) would take the bar's FOLLOW-UP segment
  // back with it, since `merged` IS followup-chatable.
  test('VALID: {FOLLOW-UP tab open with a sent message, quest moves blocked -> abandoned} => tab stays first with its transcript intact while the post-quest bar disappears', async ({
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
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'Why did we block here?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
    ).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The post-quest bar renders at the foot of the EXECUTION tab, and FOLLOW-UP is the active
    // tab right now — so the bar is only observable from across the tab bar. Switch to read it,
    // then switch back, so the rest of this test still observes the tab it is actually about.
    await followup.switchToExecutionTab();
    expect(await followup.postQuestBarVisible()).toBe(true);
    await followup.switchToFollowupTab();

    // Precondition write only — the quest's status is not the control under test here (that is
    // the title bar's ABANDON control); this merely sets up the state the tab must survive.
    await quests.patchQuestStatus({ questId: String(questId), status: 'abandoned' });

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
      page
        .getByTestId('CHAT_MESSAGE')
        .filter({ hasText: 'Why did we block here?' })
        .filter({ hasNotText: TAVERNKEEPER_PROMPT_HEADING }),
    ).toBeVisible();
  });
});
