/**
 * PURPOSE: Seeds a quest whose flow diagram carries a box with two persisted comments, an assertion
 * card with its own comment, a box with contracts but no comments and a box with neither, then opens
 * it in the QUEST SPEC panel — either the live panel or the read-only one behind the execution
 * panel's QUEST SPEC tab. Real ELK layout, real React Flow card mounting and the real HTTP quest
 * read only exist in a browser, so the mechanics live here and the scenario file asserts what they
 * return.
 *
 * USAGE:
 * const view = persistedCommentsHarness({ page, request, guildPath, sessions });
 * await view.seedAndOpenSpecPanel({ guildName: 'View Guild', status: 'review_flows', withSession: true });
 * expect(await view.commentBadgeTextsOn({ testId: 'FLOW_NODE' })).toStrictEqual(['2']);
 */
import type { APIRequestContext, Locator, Page } from '@playwright/test';

import { navigationHarness } from '../navigation/navigation.harness';
import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

const PANEL_TIMEOUT = 5_000;
const CANVAS_TIMEOUT = 10_000;

// Ids, labels and text the scenario file selects and asserts on. Exported so the scenario references
// the seeded quest rather than inlining strings that could drift away from it.
export const VIEW_COMMENTS_FLOW_ID = 'comment-view-flow';

export const COMMENTED_NODE_ID = 'commented-node';
export const COMMENTED_NODE_LABEL = 'Commented Node';
export const COMMENTED_ASSERTION_ID = 'commented-assertion';
export const COMMENTED_ASSERTION_TEXT = 'the commented box paints its own count badge';

export const CONTRACTS_ONLY_NODE_LABEL = 'Contracts Only Node';
export const BARE_NODE_LABEL = 'Bare Node';

// Two comments on the node card itself, seeded OLDEST-FIRST in quest.json so a suite that renders
// them in stored order fails the newest-first assertion instead of passing by accident.
export const NODE_COMMENT_OLDER_TEXT = 'the older note on this node';
export const NODE_COMMENT_NEWER_TEXT = 'the newer note on this node';
export const NODE_COMMENT_OLDER_AT = '2026-01-02T03:04:05.000Z';
export const NODE_COMMENT_NEWER_AT = '2026-03-04T05:06:07.000Z';

// One comment on the assertion card branching off that same node. Its createdAt sits BETWEEN the two
// node comments, so a panel that wrongly rolled observable comments up into its parent node would
// land this row in the middle of the node list rather than at an easily-spotted end.
export const ASSERTION_COMMENT_TEXT = 'the note left on this assertion';
export const ASSERTION_COMMENT_AT = '2026-02-03T04:05:06.000Z';

// A review note that is ONE unbroken token — the shape a comment takes when it names a symbol.
// pre-wrap honours the author's newlines but never splits a token with no break opportunity, so
// without overflow-wrap this row paints past the panel and the rest of the note is clipped. Long
// enough that no monospace face could fit it in the panel's content box, so the geometry assertion
// does not depend on which font the test machine resolves `monospace` to. Newest createdAt of the
// seeded set, so it renders as the FIRST panel row.
export const LONG_TOKEN_COMMENT_TEXT =
  'renameBoxCommentsTransformerFiltersByFlowIdAndNodeIdAndObservableIdNewestFirstAcrossEveryFlowOnTheQuestPlease';
export const LONG_TOKEN_COMMENT_AT = '2026-05-06T07:08:09.000Z';

export const CONTRACTS_ONLY_CONTRACT_NAME = 'ContractsOnlyPayload';
export const COMMENTED_NODE_CONTRACT_NAME = 'CommentedNodePayload';

// Three flow nodes covering the three display states this flow forks on: a node carrying comments
// AND a contract (badge beside badge, panel with both sections), a node carrying a contract but no
// comments (panel with contracts and no comments section), and a node carrying neither (empty
// panel). One assertion card branches off the commented node so an observable comment has somewhere
// to anchor and the node-vs-assertion partition has two real boxes to keep apart.
const VIEW_COMMENTS_FLOW = {
  id: VIEW_COMMENTS_FLOW_ID,
  name: 'Comment View Flow',
  flowType: 'runtime',
  entryPoint: COMMENTED_NODE_ID,
  exitPoints: ['bare-node'],
  nodes: [
    {
      id: COMMENTED_NODE_ID,
      label: COMMENTED_NODE_LABEL,
      type: 'action',
      observables: [
        {
          id: COMMENTED_ASSERTION_ID,
          type: 'ui-state',
          description: COMMENTED_ASSERTION_TEXT,
        },
      ],
    },
    {
      id: 'contracts-only-node',
      label: CONTRACTS_ONLY_NODE_LABEL,
      type: 'state',
      observables: [],
    },
    { id: 'bare-node', label: BARE_NODE_LABEL, type: 'terminal', observables: [] },
  ],
  edges: [
    { id: 'commented-to-contracts', from: COMMENTED_NODE_ID, to: 'contracts-only-node' },
    { id: 'contracts-to-bare', from: 'contracts-only-node', to: 'bare-node' },
  ],
};

// A contract on the commented node AND one on the contracts-only node. The first is what proves an
// assertion card's panel omits contracts even though its PARENT node has one anchored to it.
const VIEW_COMMENTS_CONTRACTS = [
  {
    id: 'commented-node-payload',
    name: COMMENTED_NODE_CONTRACT_NAME,
    kind: 'data',
    status: 'existing',
    source: 'packages/web/src/contracts/commented-node/commented-node-contract.ts',
    nodeId: COMMENTED_NODE_ID,
    properties: [{ name: 'boxId', type: 'FlowNodeId', description: 'The box this payload names' }],
  },
  {
    id: 'contracts-only-payload',
    name: CONTRACTS_ONLY_CONTRACT_NAME,
    kind: 'data',
    status: 'existing',
    source: 'packages/web/src/contracts/contracts-only/contracts-only-contract.ts',
    nodeId: 'contracts-only-node',
    properties: [{ name: 'label', type: 'FlowNodeLabel', description: 'The box label' }],
  },
];

const VIEW_COMMENTS_PERSISTED = [
  {
    id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001',
    flowId: VIEW_COMMENTS_FLOW_ID,
    nodeId: COMMENTED_NODE_ID,
    text: NODE_COMMENT_OLDER_TEXT,
    createdAt: NODE_COMMENT_OLDER_AT,
  },
  {
    id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002',
    flowId: VIEW_COMMENTS_FLOW_ID,
    nodeId: COMMENTED_NODE_ID,
    observableId: COMMENTED_ASSERTION_ID,
    text: ASSERTION_COMMENT_TEXT,
    createdAt: ASSERTION_COMMENT_AT,
  },
  {
    id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d003',
    flowId: VIEW_COMMENTS_FLOW_ID,
    nodeId: COMMENTED_NODE_ID,
    text: NODE_COMMENT_NEWER_TEXT,
    createdAt: NODE_COMMENT_NEWER_AT,
  },
];

const VIEW_COMMENTS_LONG_TOKEN = {
  id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d004',
  flowId: VIEW_COMMENTS_FLOW_ID,
  nodeId: COMMENTED_NODE_ID,
  text: LONG_TOKEN_COMMENT_TEXT,
  createdAt: LONG_TOKEN_COMMENT_AT,
};

// Browser-evaluated predicate: a comment row must paint no wider than the panel holding it. An
// unbroken token that cannot wrap overflows its own content box (scrollWidth exceeds clientWidth)
// AND paints past the panel's right edge. jsdom reports every width as 0, so a widget test can
// assert the break-word declaration but never that the row actually fits — only a browser can.
// Returns a boolean so the harness signature exposes no raw number. One pixel of slack absorbs
// sub-pixel rounding on the right edge; a real overflow is tens to thousands of pixels.
const COMMENT_ROW_FITS_BROWSER_FN = (el: Element): boolean => {
  const panel = el.closest('[data-testid="FLOW_NODE_DETAIL_PANEL"]');
  if (panel === null) {
    return false;
  }
  return (
    el.scrollWidth <= el.clientWidth &&
    el.getBoundingClientRect().right <= panel.getBoundingClientRect().right + 1
  );
};

const FLOW_NODE_COUNT = VIEW_COMMENTS_FLOW.nodes.length;
const OBSERVABLE_NODE_COUNT = VIEW_COMMENTS_FLOW.nodes.reduce(
  (sum, node) => sum + node.observables.length,
  0,
);

export const persistedCommentsHarness = ({
  page,
  request,
  guildPath,
  sessions,
}: {
  page: Page;
  request: APIRequestContext;
  guildPath: string;
  sessions: ReturnType<typeof sessionHarness>;
}): {
  seedAndOpenSpecPanel: (params: {
    guildName: string;
    status: string;
    withSession: boolean;
    withComments?: boolean;
    withLongToken?: boolean;
  }) => Promise<void>;
  seedAndOpenReadOnlySpecTab: (params: { guildName: string }) => Promise<void>;
  nodeCard: () => Locator;
  contractsOnlyCard: () => Locator;
  bareCard: () => Locator;
  assertionCard: () => Locator;
  commentBadgeTextsOn: (params: { testId: string }) => Promise<HTMLElement['textContent'][]>;
  commentBadgeTextOnCard: (params: { card: Locator }) => Promise<HTMLElement['textContent'][]>;
  contractBadgeTextOnCard: (params: { card: Locator }) => Promise<HTMLElement['textContent'][]>;
  clickCardBody: (params: { card: Locator }) => Promise<void>;
  clickAssertionCard: () => Promise<void>;
  panelCommentTexts: () => Promise<HTMLElement['textContent'][]>;
  panelCommentTimes: () => Promise<HTMLElement['textContent'][]>;
  panelContractNames: () => Promise<HTMLElement['textContent'][]>;
  commentRowFitsInsidePanel: (params: { index: number }) => Promise<boolean>;
} => {
  // seedAndOpen learns the questId and the guild slug at runtime, so the navigation step needs
  // somewhere to read them back from.
  const seeded = { questId: '', urlSlug: '' };

  const nodeCard = (): Locator =>
    page.getByTestId('FLOW_NODE').filter({ has: page.getByText(COMMENTED_NODE_LABEL) });

  const contractsOnlyCard = (): Locator =>
    page.getByTestId('FLOW_NODE').filter({ has: page.getByText(CONTRACTS_ONLY_NODE_LABEL) });

  const bareCard = (): Locator =>
    page.getByTestId('FLOW_NODE').filter({ has: page.getByText(BARE_NODE_LABEL) });

  const assertionCard = (): Locator =>
    page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .filter({ has: page.getByText(COMMENTED_ASSERTION_TEXT) });

  // Seeds guild + quest + quest.json and parks the ids navigation needs. Kept separate from the
  // navigation step so the two openers below can share it without duplicating the seed.
  const seed = async ({
    guildName,
    status,
    withSession,
    withComments,
    withLongToken,
  }: {
    guildName: string;
    status: string;
    withSession: boolean;
    withComments: boolean;
    withLongToken: boolean;
  }): Promise<void> => {
    const quests = questHarness({ request });
    const guild = await guildHarness({ request }).createGuild({ name: guildName, path: guildPath });

    const sessionId = `e2e-session-view-comments-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId: String(guild.id),
      title: 'E2E Persisted Comments Quest',
      userRequest: 'Build the feature',
    });
    seeded.questId = String(created.questId);
    seeded.urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    quests.writeQuestFile({
      questId: seeded.questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status,
      // withSession false drops the sessionId from the chaoswhisperer work item, the exact shape
      // hasResumableChatSessionGuard rejects — the role stays, so the ONLY difference between the
      // two seeds is the sessionId itself.
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-000000000001',
          role: 'chaoswhisperer',
          ...(withSession ? { sessionId } : {}),
        },
      ],
      flows: [VIEW_COMMENTS_FLOW],
      contracts: VIEW_COMMENTS_CONTRACTS,
      // withComments false writes NO comments key at all — a quest.json shaped exactly like one
      // authored before the field existed, rather than one carrying an empty array.
      ...(withComments
        ? {
            comments: withLongToken
              ? [...VIEW_COMMENTS_PERSISTED, VIEW_COMMENTS_LONG_TOKEN]
              : VIEW_COMMENTS_PERSISTED,
          }
        : {}),
    });
  };

  // Waits until ELK has laid out and React Flow has mounted every card kind, so a badge or panel
  // assertion never races a half-painted canvas.
  const waitForCanvas = async (): Promise<void> => {
    await page.getByTestId('FLOW_DIAGRAM').waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('REACT_FLOW_CANVAS')
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('FLOW_NODE')
      .nth(FLOW_NODE_COUNT - 1)
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    await page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .nth(OBSERVABLE_NODE_COUNT - 1)
      .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
  };

  return {
    seedAndOpenSpecPanel: async ({
      guildName,
      status,
      withSession,
      withComments = true,
      withLongToken = false,
    }: {
      guildName: string;
      status: string;
      withSession: boolean;
      withComments?: boolean;
      withLongToken?: boolean;
    }): Promise<void> => {
      await seed({ guildName, status, withSession, withComments, withLongToken });
      await navigationHarness({ page }).navigateToQuest({
        urlSlug: seeded.urlSlug,
        questId: seeded.questId,
      });
      await page
        .getByTestId('QUEST_SPEC_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

      // An approved quest surfaces the Begin Quest modal on load and its overlay intercepts every
      // canvas click. A reviewer dismisses it via Keep Chatting to read the spec — do the same. The
      // modal belongs to another flow (quest-approved-modal.e2e owns it), so dismissing precondition
      // state here bypasses no control this flow is testing.
      const keepChatting = page.getByTestId('PIXEL_BTN').filter({ hasText: 'Keep Chatting' });
      if (await keepChatting.isVisible().catch(() => false)) {
        await keepChatting.click();
        await page
          .getByTestId('QUEST_APPROVED_MODAL_TITLE')
          .waitFor({ state: 'hidden', timeout: PANEL_TIMEOUT });
      }

      await waitForCanvas();
    },

    // A complete quest renders the full-width execution panel instead of the spec panel; its QUEST
    // SPEC tab is the readOnly QuestSpecPanelWidget. Reaching the panel through the real tab is what
    // makes this the read-only surface rather than a second render of the live one.
    seedAndOpenReadOnlySpecTab: async ({ guildName }: { guildName: string }): Promise<void> => {
      await seed({
        guildName,
        status: 'complete',
        withSession: true,
        withComments: true,
        withLongToken: false,
      });
      await navigationHarness({ page }).navigateToQuest({
        urlSlug: seeded.urlSlug,
        questId: seeded.questId,
      });
      await page
        .getByTestId('execution-panel-widget')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
      await page.getByTestId('execution-panel-tab-spec').click();
      await page
        .getByTestId('QUEST_SPEC_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
      await waitForCanvas();
    },

    nodeCard,
    contractsOnlyCard,
    bareCard,
    assertionCard,

    // Every COMMENT_COUNT_BADGE across all cards carrying the given testid, so a badge painted on
    // the wrong card is as loud a failure as a missing one.
    commentBadgeTextsOn: async ({
      testId,
    }: {
      testId: string;
    }): Promise<HTMLElement['textContent'][]> =>
      page.getByTestId(testId).getByTestId('COMMENT_COUNT_BADGE').allTextContents(),

    commentBadgeTextOnCard: async ({
      card,
    }: {
      card: Locator;
    }): Promise<HTMLElement['textContent'][]> =>
      card.getByTestId('COMMENT_COUNT_BADGE').allTextContents(),

    // The CONTRACTS badge, kept separate from the comment badge so a test can never confuse the two.
    contractBadgeTextOnCard: async ({
      card,
    }: {
      card: Locator;
    }): Promise<HTMLElement['textContent'][]> =>
      card.getByTestId('FLOW_NODE_BADGE').allTextContents(),

    // Clicks the card's own label — the part of the card a reviewer clicks to open the detail panel.
    clickCardBody: async ({ card }: { card: Locator }): Promise<void> => {
      await card.getByTestId('FLOW_NODE_LABEL').click();
      await page
        .getByTestId('FLOW_NODE_DETAIL_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    },

    clickAssertionCard: async (): Promise<void> => {
      await assertionCard().click();
      await page
        .getByTestId('FLOW_NODE_DETAIL_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    },

    // Panel rows in DOM order, so the scenario asserts the rendered ORDER rather than mere presence.
    panelCommentTexts: async (): Promise<HTMLElement['textContent'][]> =>
      page.getByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT').allTextContents(),

    panelCommentTimes: async (): Promise<HTMLElement['textContent'][]> =>
      page.getByTestId('FLOW_DETAIL_PANEL_COMMENT_TIME').allTextContents(),

    panelContractNames: async (): Promise<HTMLElement['textContent'][]> =>
      page.getByTestId('FLOW_DETAIL_PANEL_CONTRACT_NAME').allTextContents(),

    // Whether the comment row at `index` actually fits inside the detail panel it is rendered in —
    // the painted outcome, measured on the real layout rather than inferred from a style rule.
    commentRowFitsInsidePanel: async ({ index }: { index: number }): Promise<boolean> =>
      page
        .getByTestId('FLOW_DETAIL_PANEL_COMMENT_TEXT')
        .nth(index)
        .evaluate(COMMENT_ROW_FITS_BROWSER_FN),
  };
};
