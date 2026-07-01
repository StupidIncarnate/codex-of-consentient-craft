/**
 * PURPOSE: Seeds an approved quest whose flow has 3+ nodes, navigates to the QUEST
 * SPEC panel, waits for the React Flow diagram to render, and exposes geometry/viewport
 * assertions (node overlap, fit-view framing, zoom scale) for the flow-diagram
 * interaction e2e. Geometry can only be measured in a real browser, so these helpers
 * live in a harness and the scenario file asserts the booleans they return.
 *
 * USAGE:
 * const diagram = flowDiagramHarness({ page, request, guildPath, sessions });
 * await diagram.seedAndOpen({ guildName: 'Diagram Guild' });
 * expect(await diagram.nodesDoNotOverlap()).toBe(true);
 */
import type { APIRequestContext, Page } from '@playwright/test';

import { navigationHarness } from '../navigation/navigation.harness';
import { guildHarness } from '../guild/guild.harness';
import { questHarness } from '../quest/quest.harness';
import type { sessionHarness } from '../session/session.harness';

const PANEL_TIMEOUT = 5_000;
const CANVAS_TIMEOUT = 10_000;
const FRAMING_EPSILON_PX = 1;
// Expanded (fullscreen) canvas must resolve a tall definite height. The black-screen bug
// collapses it to 0px, so any threshold well above 0 and below the real expanded height
// (≈ viewport − 160px) distinguishes the bug from the fix across viewport sizes.
const EXPANDED_CANVAS_MIN_PX = 300;

// Node labels / assertion text the scenario file asserts on. Exported as plain string
// constants (not signature types) so the scenario can reference them without inlining.
// FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE renders as a FLOW_OBSERVABLE_NODE card on the canvas (the
// detail panel is contracts-only), so the scenario asserts it on the canvas, not in the panel.
export const FLOW_DIAGRAM_OPEN_PAGE_LABEL = 'Open Page';
export const FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE = 'The page renders the diagram canvas';

// A branching flow (action -> decision -> two sibling terminals) so FlowsLayerWidget renders
// the ReactFlowDiagramWidget (it only renders when nodes.length > 0) and elk has a real graph
// to lay out, exercising the geometry observables this e2e owns. The two terminals sit on the
// SAME elk layer (same y, adjacent x), so if a node card is allowed to balloon to its full
// label width the siblings overlap horizontally and their branch-edge labels collide — the
// real-quest symptom this flow reproduces. Their labels are intentionally long (full
// sentences, like real quest flows) to force that overlap unless the card is sized to elk's
// reserved box. open-page and view-detail each carry one observable, so the canvas renders two
// FLOW_OBSERVABLE_NODE assertion cards branching off to the right of those nodes.
const DIAGRAM_FLOW = {
  id: 'diagram-flow',
  name: 'Diagram Interaction Flow',
  flowType: 'runtime',
  entryPoint: 'open-page',
  exitPoints: ['view-detail', 'no-detail'],
  nodes: [
    {
      id: 'open-page',
      label: FLOW_DIAGRAM_OPEN_PAGE_LABEL,
      type: 'action',
      observables: [
        {
          id: 'b1000000-0000-4000-8000-000000000001',
          type: 'ui-state',
          description: FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE,
        },
      ],
    },
    {
      id: 'has-detail',
      label:
        'Has detail to show — the reviewer can drill into this node observables and contracts, but the flow first decides whether any detail exists for this node at all before it branches to a terminal',
      type: 'decision',
      observables: [],
    },
    {
      id: 'view-detail',
      label:
        'Yes — the detail panel renders the full node detail and the page settles into its terminal state where the reviewer can read every observable and contract without any further navigation',
      type: 'terminal',
      observables: [
        {
          id: 'b1000000-0000-4000-8000-000000000002',
          type: 'ui-state',
          description: 'The detail panel shows the full node detail',
        },
      ],
    },
    {
      id: 'no-detail',
      label:
        'No — there is no detail available here, so the flow terminates right away and the reviewer is left on the canvas with the empty-state message instead of a populated detail panel',
      type: 'terminal',
      observables: [],
    },
  ],
  edges: [
    { id: 'open-to-decision', from: 'open-page', to: 'has-detail' },
    // One short branch label and one long one: the long condition would paint across its
    // sibling at the divergence point unless the diagram bounds (truncates) the label width.
    { id: 'decision-to-view', from: 'has-detail', to: 'view-detail', label: 'yes' },
    {
      id: 'decision-to-no',
      from: 'has-detail',
      to: 'no-detail',
      label: 'no — there is no detail to show for this node so the flow terminates immediately',
    },
  ],
};

const EXPECTED_NODE_COUNT = DIAGRAM_FLOW.nodes.length;

// Each observable becomes its own FLOW_OBSERVABLE_NODE card branching to the right of its flow
// node, wired by one connector edge. Both counts drive the assertion-node and edge-count checks.
const EXPECTED_OBSERVABLE_COUNT = DIAGRAM_FLOW.nodes.reduce(
  (sum, node) => sum + node.observables.length,
  0,
);

// A second flow so the spec panel renders a tab per flow. Its node ids are DISTINCT from the
// first flow's — switching to its tab must re-run the layout for THESE ids, or every node falls
// back to {0,0} and piles up (the bug this guards). One node carries the label below so the
// switch can wait for the second flow's diagram to paint.
const SECOND_FLOW_FIRST_NODE_LABEL = 'Begin Review';
const SECOND_DIAGRAM_FLOW = {
  id: 'second-diagram-flow',
  name: 'Second Review Flow',
  flowType: 'operational',
  entryPoint: 'review-start',
  exitPoints: ['review-done'],
  nodes: [
    { id: 'review-start', label: SECOND_FLOW_FIRST_NODE_LABEL, type: 'action', observables: [] },
    { id: 'review-check', label: 'Looks Good?', type: 'decision', observables: [] },
    { id: 'review-done', label: 'Approved', type: 'terminal', observables: [] },
  ],
  edges: [
    { id: 'review-start-to-check', from: 'review-start', to: 'review-check' },
    { id: 'review-check-to-done', from: 'review-check', to: 'review-done', label: 'ok' },
  ],
};

const SECOND_FLOW_NODE_COUNT = SECOND_DIAGRAM_FLOW.nodes.length;

// A deliberately TALL flow: a vertical chain whose middle nodes each carry many observables, so
// their assertion columns stack into a graph far taller than the collapsed (800px) canvas. This
// reproduces the real-quest symptom — a large assertion-rich flow whose fit-view could not shrink
// the whole graph into the collapsed canvas (it only appeared once expanded to fullscreen). The
// fix lowers the React Flow minZoom so fit-view frames the entire graph even when collapsed. Each
// big node gets 7 assertions via an inline Array.from (kept inline so the flow stays a plain
// literal with no raw-primitive type annotation).
const LARGE_FLOW_FIRST_NODE_LABEL = 'Large Graph Entry';
const LARGE_DIAGRAM_FLOW = {
  id: 'large-diagram-flow',
  name: 'Large Assertion Flow',
  flowType: 'runtime',
  entryPoint: 'large-entry',
  exitPoints: ['large-end'],
  nodes: [
    {
      id: 'large-entry',
      label: LARGE_FLOW_FIRST_NODE_LABEL,
      type: 'action',
      observables: Array.from({ length: 7 }, (_unused, i) => ({
        id: `entry-assertion-${i + 1}`,
        type: 'ui-state',
        description: `entry assertion ${i + 1} renders its outcome row and stays readable`,
      })),
    },
    {
      id: 'large-step-a',
      label: 'Stage A',
      type: 'state',
      observables: Array.from({ length: 7 }, (_unused, i) => ({
        id: `a-assertion-${i + 1}`,
        type: 'ui-state',
        description: `stage A assertion ${i + 1} renders its outcome row and stays readable`,
      })),
    },
    {
      id: 'large-step-b',
      label: 'Stage B',
      type: 'state',
      observables: Array.from({ length: 7 }, (_unused, i) => ({
        id: `b-assertion-${i + 1}`,
        type: 'ui-state',
        description: `stage B assertion ${i + 1} renders its outcome row and stays readable`,
      })),
    },
    { id: 'large-end', label: 'Large Graph Exit', type: 'terminal', observables: [] },
  ],
  edges: [
    { id: 'large-entry-to-a', from: 'large-entry', to: 'large-step-a' },
    { id: 'large-a-to-b', from: 'large-step-a', to: 'large-step-b' },
    { id: 'large-b-to-end', from: 'large-step-b', to: 'large-end' },
  ],
};

const LARGE_FLOW_NODE_COUNT = LARGE_DIAGRAM_FLOW.nodes.length;

// Browser-evaluated predicates: read the React Flow viewport's x-scale from its CSS
// matrix transform and compare against a baseline. They run inside page.waitForFunction
// (browser context) and return a boolean, so the harness signature exposes no raw number.
const VIEWPORT_SCALE_GT_BROWSER_FN = (baseline: number): boolean => {
  const el = document.querySelector('.react-flow__viewport');
  if (el === null) {
    return false;
  }
  const { transform } = globalThis.getComputedStyle(el);
  const match = /matrix\(([^,]+),/u.exec(transform);
  return match !== null && Number(match[1]) > baseline;
};

const VIEWPORT_SCALE_LT_BROWSER_FN = (baseline: number): boolean => {
  const el = document.querySelector('.react-flow__viewport');
  if (el === null) {
    return false;
  }
  const { transform } = globalThis.getComputedStyle(el);
  const match = /matrix\(([^,]+),/u.exec(transform);
  return match !== null && Number(match[1]) < baseline;
};

export const flowDiagramHarness = ({
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
  seedAndOpen: (params: { guildName: string }) => Promise<void>;
  hasExpectedNodeCount: () => Promise<boolean>;
  nodesHaveDistinctCoordinates: () => Promise<boolean>;
  nodesDoNotOverlap: () => Promise<boolean>;
  nodeLabelsFullyVisible: () => Promise<boolean>;
  allNodesWithinCanvas: () => Promise<boolean>;
  zoomInGrowsScale: () => Promise<boolean>;
  zoomOutShrinksScale: () => Promise<boolean>;
  canvasHasRenderableHeight: () => Promise<boolean>;
  allEdgesRendered: () => Promise<boolean>;
  branchLabelRendered: (params: { label: string }) => Promise<boolean>;
  branchLabelsDoNotOverlap: () => Promise<boolean>;
  assertionNodeRendered: (params: { text: string }) => Promise<boolean>;
  hasExpectedAssertionCount: () => Promise<boolean>;
  assertionNodesBranchRightOfFlowNodes: () => Promise<boolean>;
  clickPaneBackground: () => Promise<void>;
  nativeControlsPresentButHidden: () => Promise<boolean>;
  customControlsVisible: () => Promise<boolean>;
  expandToFullscreen: () => Promise<void>;
  expandedCanvasIsTall: () => Promise<boolean>;
  switchToSecondFlowTab: () => Promise<void>;
  hasExpectedSecondFlowNodeCount: () => Promise<boolean>;
  switchToLargeFlowTab: () => Promise<void>;
  hasExpectedLargeFlowNodeCount: () => Promise<boolean>;
  allAssertionNodesWithinCanvas: () => Promise<boolean>;
} => {
  // Internal (non-exported) helpers: return types are inferred from Playwright APIs so the
  // signature carries no raw-primitive annotation. The factory's public methods below all
  // return Promise<boolean> | Promise<void>.
  const getBoundingBoxes = async () => {
    const nodes = page.getByTestId('FLOW_NODE');
    const count = await nodes.count();
    return Promise.all(
      Array.from({ length: count }, async (_unused, index) => {
        const box = await nodes.nth(index).boundingBox();
        if (box === null) {
          throw new Error(`FLOW_NODE at index ${index} has no bounding box`);
        }
        return { x: box.x, y: box.y, w: box.width, h: box.height };
      }),
    );
  };

  const currentScale = async () => {
    const transform = await page
      .locator('.react-flow__viewport')
      .first()
      .evaluate((el) => globalThis.getComputedStyle(el).transform);
    const match = /matrix\(([^,]+),/u.exec(transform);
    if (match === null) {
      throw new Error(`Could not parse viewport scale from transform: ${transform}`);
    }
    return Number(match[1]);
  };

  return {
    seedAndOpen: async ({ guildName }: { guildName: string }): Promise<void> => {
      const quests = questHarness({ request });
      const nav = navigationHarness({ page });
      const guild = await guildHarness({ request }).createGuild({
        name: guildName,
        path: guildPath,
      });
      const guildId = String(guild.id);

      const sessionId = `e2e-session-diagram-${Date.now()}`;
      sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

      const created = await quests.createQuest({
        guildId,
        title: 'E2E Flow Diagram Quest',
        userRequest: 'Build the feature',
      });

      // Write the quest file as `approved` BEFORE navigating so the spec panel (and its
      // flow diagram) renders directly on load. An already-approved quest also surfaces the
      // Begin Quest modal on load, which is dismissed below so its overlay doesn't intercept
      // diagram interaction clicks.
      quests.writeQuestFile({
        questId: String(created.questId),
        questFolder: String(created.questFolder),
        questFilePath: String(created.filePath),
        status: 'approved',
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-000000000001',
            role: 'chaoswhisperer',
            sessionId,
          },
        ],
        flows: [DIAGRAM_FLOW, SECOND_DIAGRAM_FLOW, LARGE_DIAGRAM_FLOW],
      });

      const urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');
      await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

      await page
        .getByTestId('QUEST_SPEC_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

      // An already-approved quest surfaces the "Begin Quest" modal on load; its overlay
      // intercepts every diagram interaction click. A reviewer dismisses it via "Keep
      // Chatting" to review the spec — do the same so the diagram is interactable. The
      // modal is precondition state outside this flow's scope (its own e2e covers the
      // Begin Quest button), so dismissing it here does not bypass the control under test.
      const keepChatting = page.getByTestId('PIXEL_BTN').filter({ hasText: 'Keep Chatting' });
      if (await keepChatting.isVisible().catch(() => false)) {
        await keepChatting.click();
        await page
          .getByTestId('QUEST_APPROVED_MODAL_TITLE')
          .waitFor({ state: 'hidden', timeout: PANEL_TIMEOUT });
      }
      await page.getByTestId('FLOW_DIAGRAM').waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      await page
        .getByTestId('REACT_FLOW_CANVAS')
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      // Wait until elk has laid out and React Flow rendered all node cards.
      await page
        .getByTestId('FLOW_NODE')
        .nth(EXPECTED_NODE_COUNT - 1)
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    },

    hasExpectedNodeCount: async (): Promise<boolean> => {
      const count = await page.getByTestId('FLOW_NODE').count();
      return count === EXPECTED_NODE_COUNT;
    },

    nodesHaveDistinctCoordinates: async (): Promise<boolean> => {
      const boxes = await getBoundingBoxes();
      const coordKeys = boxes.map((box) => `${Math.round(box.x)},${Math.round(box.y)}`);
      return new Set(coordKeys).size === boxes.length;
    },

    nodesDoNotOverlap: async (): Promise<boolean> => {
      const boxes = await getBoundingBoxes();
      const overlapping = boxes.some((a, i) =>
        boxes.some((b, j) => {
          if (i >= j) {
            return false;
          }
          return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        }),
      );
      return !overlapping;
    },

    // The full node label must be readable on the card itself (no clamp/ellipsis). A clamped
    // label clips its overflow, so scrollHeight exceeds clientHeight; asserts no label box is
    // clipped.
    nodeLabelsFullyVisible: async (): Promise<boolean> => {
      const labels = page.getByTestId('FLOW_NODE_LABEL');
      const count = await labels.count();
      const clippedFlags = await Promise.all(
        Array.from({ length: count }, async (_unused, index) =>
          labels.nth(index).evaluate((el) => el.scrollHeight > el.clientHeight + 1),
        ),
      );
      return clippedFlags.every((isClipped) => !isClipped);
    },

    allNodesWithinCanvas: async (): Promise<boolean> => {
      const canvasBox = await page.getByTestId('REACT_FLOW_CANVAS').boundingBox();
      if (canvasBox === null) {
        throw new Error('REACT_FLOW_CANVAS has no bounding box');
      }
      const boxes = await getBoundingBoxes();
      return boxes.every(
        (box) =>
          box.x >= canvasBox.x - FRAMING_EPSILON_PX &&
          box.y >= canvasBox.y - FRAMING_EPSILON_PX &&
          box.x + box.w <= canvasBox.x + canvasBox.width + FRAMING_EPSILON_PX &&
          box.y + box.h <= canvasBox.y + canvasBox.height + FRAMING_EPSILON_PX,
      );
    },

    zoomInGrowsScale: async (): Promise<boolean> => {
      const before = await currentScale();
      await page.getByTestId('ZOOM_IN_BUTTON').click();
      await page.waitForFunction(VIEWPORT_SCALE_GT_BROWSER_FN, before, { timeout: PANEL_TIMEOUT });
      const after = await currentScale();
      return after > before;
    },

    zoomOutShrinksScale: async (): Promise<boolean> => {
      const before = await currentScale();
      await page.getByTestId('ZOOM_OUT_BUTTON').click();
      await page.waitForFunction(VIEWPORT_SCALE_LT_BROWSER_FN, before, { timeout: PANEL_TIMEOUT });
      const after = await currentScale();
      return after < before;
    },

    // The React Flow canvas only renders a usable graph when its wrapper resolves a DEFINITE
    // height — a bare maxHeight collapses to 0 because the absolutely positioned nodes don't
    // contribute height. Asserts the REACT_FLOW_CANVAS occupies real vertical space.
    canvasHasRenderableHeight: async (): Promise<boolean> => {
      const box = await page.getByTestId('REACT_FLOW_CANVAS').boundingBox();
      if (box === null) {
        throw new Error('REACT_FLOW_CANVAS has no bounding box');
      }
      return box.height >= EXPECTED_NODE_COUNT;
    },

    // Edges only render when the custom node card exposes React Flow connection handles.
    // Without handles React Flow drops every edge ("source handle id: null"). One path renders
    // per flow edge PLUS one connector per observable (flow card right handle -> assertion card).
    allEdgesRendered: async (): Promise<boolean> => {
      const expectedEdgeCount = DIAGRAM_FLOW.edges.length + EXPECTED_OBSERVABLE_COUNT;
      await page
        .locator('.react-flow__edge-path')
        .nth(expectedEdgeCount - 1)
        .waitFor({ state: 'attached', timeout: CANVAS_TIMEOUT });
      const renderedEdges = await page.locator('.react-flow__edge-path').count();
      return renderedEdges === expectedEdgeCount;
    },

    // The custom edge renders its label as a FLOW_EDGE_LABEL HTML box (full text, wrapped) at
    // the edge midpoint. Asserts the branch label box with the given text is painted.
    branchLabelRendered: async ({ label }: { label: string }): Promise<boolean> => {
      const labelLocator = page.getByTestId('FLOW_EDGE_LABEL').filter({ hasText: label });
      await labelLocator.first().waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      return (await labelLocator.count()) >= 1;
    },

    // Branch-edge labels (FLOW_EDGE_LABEL boxes) are painted at edge midpoints. A long condition
    // on one branch must not paint over the sibling branch's label — the diagram bounds each
    // label box width and spaces siblings so no two label boxes intersect.
    branchLabelsDoNotOverlap: async (): Promise<boolean> => {
      const labels = page.getByTestId('FLOW_EDGE_LABEL');
      const count = await labels.count();
      const boxes = await Promise.all(
        Array.from({ length: count }, async (_unused, index) => {
          const box = await labels.nth(index).boundingBox();
          if (box === null) {
            throw new Error(`edge label at index ${index} has no bounding box`);
          }
          return { x: box.x, y: box.y, w: box.width, h: box.height };
        }),
      );
      const overlapping = boxes.some((a, i) =>
        boxes.some((b, j) => {
          if (i >= j) {
            return false;
          }
          return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        }),
      );
      return !overlapping;
    },

    // Each assertion (observable) renders as its own FLOW_OBSERVABLE_NODE card on the canvas —
    // always visible, no click needed. Asserts the given assertion text is painted as a card.
    assertionNodeRendered: async ({ text }: { text: string }): Promise<boolean> => {
      const node = page.getByTestId('FLOW_OBSERVABLE_NODE').filter({ hasText: text });
      await node.first().waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      return (await node.count()) >= 1;
    },

    hasExpectedAssertionCount: async (): Promise<boolean> => {
      const count = await page.getByTestId('FLOW_OBSERVABLE_NODE').count();
      return count === EXPECTED_OBSERVABLE_COUNT;
    },

    // Every assertion card sits clear to the RIGHT of a flow node (its parent) and overlaps no
    // flow node — proving assertions branch off to the side rather than stacking on the spine.
    assertionNodesBranchRightOfFlowNodes: async (): Promise<boolean> => {
      const flowBoxes = await getBoundingBoxes();
      const obsNodes = page.getByTestId('FLOW_OBSERVABLE_NODE');
      const obsCount = await obsNodes.count();
      const obsBoxes = await Promise.all(
        Array.from({ length: obsCount }, async (_unused, index) => {
          const box = await obsNodes.nth(index).boundingBox();
          if (box === null) {
            throw new Error(`FLOW_OBSERVABLE_NODE at index ${index} has no bounding box`);
          }
          return { x: box.x, y: box.y, w: box.width, h: box.height };
        }),
      );
      return obsBoxes.every((obs) => {
        const overlapsFlowNode = flowBoxes.some(
          (f) =>
            obs.x < f.x + f.w && obs.x + obs.w > f.x && obs.y < f.y + f.h && obs.y + obs.h > f.y,
        );
        const hasParentToLeft = flowBoxes.some((f) => f.x + f.w <= obs.x + FRAMING_EPSILON_PX);
        return !overlapsFlowNode && hasParentToLeft;
      });
    },

    // The real React Flow pane is `.react-flow__pane` (no testid). Clicking it must deselect
    // via React Flow's onPaneClick — a DOM-testid sniff would never fire in the real browser.
    clickPaneBackground: async (): Promise<void> => {
      await page.locator('.react-flow__pane').click({ position: { x: 5, y: 5 } });
    },

    // The diagram ships ONE set of controls: the custom RPG buttons. React Flow's native
    // `.react-flow__controls` panel must stay in the DOM (the custom buttons drive zoom/fit by
    // clicking its hidden actuator buttons) but must NOT paint — otherwise two control clusters
    // stack on top of each other. Asserts the native panel is attached but not visible.
    nativeControlsPresentButHidden: async (): Promise<boolean> => {
      const native = page.locator('.react-flow__controls');
      await native.first().waitFor({ state: 'attached', timeout: CANVAS_TIMEOUT });
      const present = (await native.count()) >= 1;
      const visible = await native.first().isVisible();
      return present && !visible;
    },

    customControlsVisible: async (): Promise<boolean> => {
      const [zoomIn, zoomOut, fitView, fullscreen] = await Promise.all([
        page.getByTestId('ZOOM_IN_BUTTON').isVisible(),
        page.getByTestId('ZOOM_OUT_BUTTON').isVisible(),
        page.getByTestId('FIT_VIEW_BUTTON').isVisible(),
        page.getByTestId('FULLSCREEN_BUTTON').isVisible(),
      ]);
      return zoomIn && zoomOut && fitView && fullscreen;
    },

    // Toggles the fullscreen (expand) control and waits for the canvas to resolve its tall
    // definite height. The black-screen bug leaves the canvas at 0px, so this wait would time
    // out against unfixed source.
    expandToFullscreen: async (): Promise<void> => {
      await page.getByTestId('FULLSCREEN_BUTTON').click();
      await page.waitForFunction(
        (minPx) => {
          const canvas = document.querySelector('[data-testid="REACT_FLOW_CANVAS"]');
          return canvas !== null && canvas.getBoundingClientRect().height > minPx;
        },
        EXPANDED_CANVAS_MIN_PX,
        { timeout: CANVAS_TIMEOUT },
      );
    },

    expandedCanvasIsTall: async (): Promise<boolean> => {
      const box = await page.getByTestId('REACT_FLOW_CANVAS').boundingBox();
      if (box === null) {
        throw new Error('REACT_FLOW_CANVAS has no bounding box');
      }
      return box.height > EXPANDED_CANVAS_MIN_PX;
    },

    // Clicks the second flow's tab and waits for its diagram to re-lay-out and paint (the second
    // flow's first node label appears, and all its nodes render).
    switchToSecondFlowTab: async (): Promise<void> => {
      await page.getByTestId('FLOW_TAB').nth(1).click();
      await page
        .getByTestId('FLOW_NODE_LABEL')
        .filter({ hasText: SECOND_FLOW_FIRST_NODE_LABEL })
        .first()
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      await page
        .getByTestId('FLOW_NODE')
        .nth(SECOND_FLOW_NODE_COUNT - 1)
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    },

    hasExpectedSecondFlowNodeCount: async (): Promise<boolean> => {
      const count = await page.getByTestId('FLOW_NODE').count();
      return count === SECOND_FLOW_NODE_COUNT;
    },

    // Clicks the large (tall, assertion-heavy) flow's tab and waits for its diagram to re-lay-out
    // and paint. Switching tabs remounts the diagram so fit-view runs fresh against the collapsed
    // canvas for THIS large graph — the exact path that left the diagram blank before the minZoom
    // fix.
    switchToLargeFlowTab: async (): Promise<void> => {
      await page.getByTestId('FLOW_TAB').nth(2).click();
      await page
        .getByTestId('FLOW_NODE_LABEL')
        .filter({ hasText: LARGE_FLOW_FIRST_NODE_LABEL })
        .first()
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
      await page
        .getByTestId('FLOW_NODE')
        .nth(LARGE_FLOW_NODE_COUNT - 1)
        .waitFor({ state: 'visible', timeout: CANVAS_TIMEOUT });
    },

    hasExpectedLargeFlowNodeCount: async (): Promise<boolean> => {
      const count = await page.getByTestId('FLOW_NODE').count();
      return count === LARGE_FLOW_NODE_COUNT;
    },

    // Every assertion card must sit inside the canvas after fit-view — a collapsed canvas that
    // cannot shrink the tall graph leaves the assertion cards (and flow nodes) outside its bounds,
    // which reads as "the diagram does not render unless fullscreen".
    allAssertionNodesWithinCanvas: async (): Promise<boolean> => {
      const canvasBox = await page.getByTestId('REACT_FLOW_CANVAS').boundingBox();
      if (canvasBox === null) {
        throw new Error('REACT_FLOW_CANVAS has no bounding box');
      }
      const obsNodes = page.getByTestId('FLOW_OBSERVABLE_NODE');
      const obsCount = await obsNodes.count();
      const obsBoxes = await Promise.all(
        Array.from({ length: obsCount }, async (_unused, index) => {
          const box = await obsNodes.nth(index).boundingBox();
          if (box === null) {
            throw new Error(`FLOW_OBSERVABLE_NODE at index ${index} has no bounding box`);
          }
          return { x: box.x, y: box.y, w: box.width, h: box.height };
        }),
      );
      return obsBoxes.every(
        (box) =>
          box.x >= canvasBox.x - FRAMING_EPSILON_PX &&
          box.y >= canvasBox.y - FRAMING_EPSILON_PX &&
          box.x + box.w <= canvasBox.x + canvasBox.width + FRAMING_EPSILON_PX &&
          box.y + box.h <= canvasBox.y + canvasBox.height + FRAMING_EPSILON_PX,
      );
    },
  };
};
