import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  persistedCommentsHarness,
  ASSERTION_COMMENT_AT,
  ASSERTION_COMMENT_TEXT,
  COMMENTED_ASSERTION_TEXT,
  COMMENTED_NODE_CONTRACT_NAME,
  CONTRACTS_ONLY_CONTRACT_NAME,
  FIRST_ASSERTION_TEXT,
  LONG_TOKEN_COMMENT_TEXT,
  NODE_COMMENT_NEWER_AT,
  NODE_COMMENT_NEWER_TEXT,
  NODE_COMMENT_OLDER_AT,
  NODE_COMMENT_OLDER_TEXT,
  SECOND_ASSERTION_COMMENT_TEXT,
  SECOND_ASSERTION_TEXT,
} from '../../../test/harnesses/persisted-comments/persisted-comments.harness';

const GUILD_PATH = '/tmp/dm-e2e-view-persisted-comments';
const REVIEW_FLOWS = 'review_flows';
const APPROVED = 'approved';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('View Persisted Comments on a Quest', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  // #quest-spec-panel-loaded — the flow's entry. questContract proves the default in a unit test;
  // this proves the whole read path survives it: a quest.json with no comments key at all is fetched
  // over HTTP, parsed, and painted as a full canvas rather than failing validation on the way in.
  test('EMPTY: {quest.json written with no comments key at all} => the diagram paints every box and renders zero COMMENT_COUNT_BADGE elements', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Legacy Comments Guild',
      status: REVIEW_FLOWS,
      withSession: true,
      withComments: false,
    });

    // The canvas really painted, so the zero badges below mean "no comments" rather than "no quest".
    await expect(page.getByTestId('FLOW_NODE')).toHaveCount(4);
    await expect(page.getByTestId('FLOW_OBSERVABLE_NODE')).toHaveCount(3);
    expect(await view.commentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual([]);
    expect(await view.commentBadgeTextsOn({ testId: 'FLOW_OBSERVABLE_NODE' })).toStrictEqual([]);
  });

  // #render-beadge branch of #box-has-persisted-comments, plus the #no-comment-badge branch on the
  // same canvas: one seed forks both ways, so a badge painted on the wrong box fails here.
  test('VALID: {review_flows quest with a resumable session and persisted comments} => the commented node badges 2 beside its contracts badge, its assertion card badges 1, the uncommented boxes badge nothing and the compose button still renders', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Badge Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    expect(await view.commentBadgeTextOnCard({ card: view.nodeCard() })).toStrictEqual(['2']);
    // The contracts badge is a SEPARATE badge on the same card — one count must never be painted
    // into the other's slot.
    expect(await view.contractBadgeTextOnCard({ card: view.nodeCard() })).toStrictEqual(['1']);
    expect(await view.commentBadgeTextOnCard({ card: view.assertionCard() })).toStrictEqual(['1']);
    expect(await view.commentBadgeTextOnCard({ card: view.contractsOnlyCard() })).toStrictEqual([]);
    expect(await view.commentBadgeTextOnCard({ card: view.bareCard() })).toStrictEqual([]);
    // Badge and compose button coexist on one card: the two gates are independent.
    await expect(view.nodeCard().getByTestId('COMMENT_BUTTON')).toHaveCount(1);
  });

  // #check-badge-per-assertion-card — each assertion card must badge its OWN observableId. A node
  // with a single assertion card cannot distinguish "badges its own id" from "badges its node's
  // first observable"; this node carries two, with the only comment on the second, so a badge (or a
  // panel) that rolled up to the first card's id instead of its own fails loudly.
  test('VALID: {a node with two assertion cards, the only comment anchored to the second} => the second assertion badges 1 while the first assertion and the node card badge nothing, and each card opens its own panel', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Per Assertion Badge Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    // Neither the node card nor the first assertion carries a comment of its own, so a badge on
    // either one here would prove the count leaked from the second card's comment.
    expect(await view.commentBadgeTextOnCard({ card: view.twoAssertionsNodeCard() })).toStrictEqual(
      [],
    );
    expect(await view.commentBadgeTextOnCard({ card: view.firstAssertionCard() })).toStrictEqual(
      [],
    );
    expect(await view.commentBadgeTextOnCard({ card: view.secondAssertionCard() })).toStrictEqual([
      '1',
    ]);

    await view.clickObservableCard({ card: view.firstAssertionCard() });
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_HEADING')).toHaveText(FIRST_ASSERTION_TEXT);
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_COMMENTS')).toHaveCount(0);

    await view.clickObservableCard({ card: view.secondAssertionCard() });
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_HEADING')).toHaveText(SECOND_ASSERTION_TEXT);
    expect(await view.panelCommentTexts()).toStrictEqual([SECOND_ASSERTION_COMMENT_TEXT]);
  });

  // #check-badge-without-button-when-approved — the status gate closes on the button alone.
  test('VALID: {status approved with a resumable session} => the commented boxes keep their COMMENT_COUNT_BADGE while the diagram renders zero COMMENT_BUTTON elements', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Approved Badge Guild',
      status: APPROVED,
      withSession: true,
    });

    expect(await view.commentBadgeTextOnCard({ card: view.nodeCard() })).toStrictEqual(['2']);
    expect(await view.commentBadgeTextOnCard({ card: view.assertionCard() })).toStrictEqual(['1']);
    // Approval is exactly when the review the comments capture becomes most worth reading, so the
    // record must survive the gate that removes the compose affordance.
    await expect(page.getByTestId('COMMENT_BUTTON')).toHaveCount(0);
  });

  // #check-badge-without-button-when-sessionless — the OTHER gate, closing independently of status.
  test('VALID: {status review_flows with no work item carrying a sessionId} => the commented boxes keep their COMMENT_COUNT_BADGE while the diagram renders zero COMMENT_BUTTON elements', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Sessionless Badge Guild',
      status: REVIEW_FLOWS,
      withSession: false,
    });

    expect(await view.commentBadgeTextOnCard({ card: view.nodeCard() })).toStrictEqual(['2']);
    expect(await view.commentBadgeTextOnCard({ card: view.assertionCard() })).toStrictEqual(['1']);
    await expect(page.getByTestId('COMMENT_BUTTON')).toHaveCount(0);
  });

  // #click-badged-box -> #detail-panel-with-comments -> #comments-listed-newest-first terminal.
  test('VALID: {click the commented FLOW_NODE} => the panel lists only that node own comments, newest first, each row carrying its text and its createdAt', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Newest First Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await view.clickCardBody({ card: view.nodeCard() });

    await expect(page.getByTestId('FLOW_DETAIL_PANEL_COMMENTS')).toBeVisible();
    // Stored oldest-first in quest.json, so this order is the render reversing them, not the file
    // order leaking through. The assertion card's comment is absent even though its createdAt sits
    // between these two — a roll-up would land it in the middle of this list.
    expect(await view.panelCommentTexts()).toStrictEqual([
      NODE_COMMENT_NEWER_TEXT,
      NODE_COMMENT_OLDER_TEXT,
    ]);
    expect(await view.panelCommentTimes()).toStrictEqual([
      NODE_COMMENT_NEWER_AT,
      NODE_COMMENT_OLDER_AT,
    ]);
    // The node panel still shows the contracts anchored to the node itself.
    expect(await view.panelContractNames()).toStrictEqual([COMMENTED_NODE_CONTRACT_NAME]);
  });

  // #check-long-comment-token-wraps — a PAINTED-width claim, so a browser is the only place it can
  // be observed: jsdom has no layout engine and reports every width as 0, which is why the widget
  // test can assert the break-word declaration but never that the row actually fits. Without that
  // declaration this row paints hundreds of pixels past the panel and the rest of the note is
  // clipped, while the declaration-only test stays green.
  test('EDGE: {a comment whose text is one unbroken token wider than the panel} => the row wraps inside FLOW_NODE_DETAIL_PANEL instead of painting past its right edge', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Long Token Guild',
      status: REVIEW_FLOWS,
      withSession: true,
      withLongToken: true,
    });

    await view.clickCardBody({ card: view.nodeCard() });

    // Newest createdAt of the three node comments, so the long-token note is row 0 — and the whole
    // note is present in the DOM, which is what makes "clipped" a rendering question rather than a
    // truncated-text one.
    expect(await view.panelCommentTexts()).toStrictEqual([
      LONG_TOKEN_COMMENT_TEXT,
      NODE_COMMENT_NEWER_TEXT,
      NODE_COMMENT_OLDER_TEXT,
    ]);
    expect(await view.commentRowFitsInsidePanel({ index: 0 })).toBe(true);
    // The ordinary rows are measured too, so this test also fails if a wrap fix pushed any other
    // row out of the panel.
    expect(await view.commentRowFitsInsidePanel({ index: 1 })).toBe(true);
    expect(await view.commentRowFitsInsidePanel({ index: 2 })).toBe(true);
  });

  // #detail-panel-with-comments, the assertion-card side: its own comments, no contracts, and the
  // parent node left unselected so the selection ring and the open panel name the same box.
  test('VALID: {click the FLOW_OBSERVABLE_NODE} => the panel heads with the assertion description, lists that assertion own comment, renders zero contract rows and leaves the parent node card unselected', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Assertion Panel Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await view.clickAssertionCard();

    await expect(page.getByTestId('FLOW_DETAIL_PANEL_HEADING')).toHaveText(
      COMMENTED_ASSERTION_TEXT,
    );
    expect(await view.panelCommentTexts()).toStrictEqual([ASSERTION_COMMENT_TEXT]);
    expect(await view.panelCommentTimes()).toStrictEqual([ASSERTION_COMMENT_AT]);
    // The parent node HAS a contract anchored to it, and the assertion panel must still show none —
    // contracts anchor to nodes, not to assertions.
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_CONTRACTS')).toHaveCount(0);
    expect(await view.panelContractNames()).toStrictEqual([]);
    await expect(page.locator('[data-testid="FLOW_NODE"][data-selected="true"]')).toHaveCount(0);
  });

  // #click-unbadged-box -> #detail-panel-no-comments -> #panel-without-comments terminal, the
  // "box still has other content" side.
  test('EMPTY: {click a box carrying contracts but zero comments} => FLOW_DETAIL_PANEL_COMMENTS is absent while its contract rows still render', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'No Comments Section Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await view.clickCardBody({ card: view.contractsOnlyCard() });

    await expect(page.getByTestId('FLOW_DETAIL_PANEL_COMMENTS')).toHaveCount(0);
    expect(await view.panelContractNames()).toStrictEqual([CONTRACTS_ONLY_CONTRACT_NAME]);
    // Contracts alone is content, so the panel is not the empty state either.
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_EMPTY')).toHaveCount(0);
  });

  // #panel-without-comments terminal, the "box has nothing at all" side.
  test('EMPTY: {click a box carrying neither comments nor contracts} => the panel renders FLOW_DETAIL_PANEL_EMPTY rather than an empty comments section', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenSpecPanel({
      guildName: 'Empty Panel Guild',
      status: REVIEW_FLOWS,
      withSession: true,
    });

    await view.clickCardBody({ card: view.bareCard() });

    await expect(page.getByTestId('FLOW_DETAIL_PANEL_EMPTY')).toBeVisible();
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_COMMENTS')).toHaveCount(0);
    await expect(page.getByTestId('FLOW_DETAIL_PANEL_CONTRACTS')).toHaveCount(0);
  });

  // #comments-listed-newest-first terminal reached through the read-only surface: a complete quest
  // renders the execution panel, and its QUEST SPEC tab is the readOnly QuestSpecPanelWidget.
  test('VALID: {complete quest opened through the execution panel QUEST SPEC tab} => the read-only panel still badges the box and lists its comment rows newest first', async ({
    page,
    request,
  }) => {
    const view = persistedCommentsHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await view.seedAndOpenReadOnlySpecTab({ guildName: 'Read Only Comments Guild' });

    // readOnly drops the action bar — proof this is the read-only render, not the live panel.
    await expect(page.getByTestId('ACTION_BAR')).toHaveCount(0);
    await expect(page.getByTestId('COMMENT_BUTTON')).toHaveCount(0);
    expect(await view.commentBadgeTextOnCard({ card: view.nodeCard() })).toStrictEqual(['2']);

    await view.clickCardBody({ card: view.nodeCard() });

    expect(await view.panelCommentTexts()).toStrictEqual([
      NODE_COMMENT_NEWER_TEXT,
      NODE_COMMENT_OLDER_TEXT,
    ]);
  });
});
