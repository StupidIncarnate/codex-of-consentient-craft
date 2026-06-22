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

// Node labels / observable text the scenario file asserts on. Exported as plain string
// constants (not signature types) so the scenario can reference them without inlining.
export const FLOW_DIAGRAM_OPEN_PAGE_LABEL = 'Open Page';
export const FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE = 'The page renders the diagram canvas';

// A flow with 3 nodes (action -> decision -> terminal) so FlowsLayerWidget renders the
// ReactFlowDiagramWidget (it only renders when nodes.length > 0) and elk has a real
// graph to lay out, exercising the geometry observables this e2e owns. One node carries
// observables so the detail panel has content to show.
const DIAGRAM_FLOW = {
  id: 'diagram-flow',
  name: 'Diagram Interaction Flow',
  flowType: 'runtime',
  entryPoint: 'open-page',
  exitPoints: ['view-detail'],
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
      label: 'Has Detail',
      type: 'decision',
      observables: [],
    },
    {
      id: 'view-detail',
      label: 'View Detail',
      type: 'terminal',
      observables: [
        {
          id: 'b1000000-0000-4000-8000-000000000002',
          type: 'ui-state',
          description: 'The detail panel shows the full node detail',
        },
      ],
    },
  ],
  edges: [
    { id: 'open-to-decision', from: 'open-page', to: 'has-detail' },
    { id: 'decision-to-terminal', from: 'has-detail', to: 'view-detail', label: 'yes' },
  ],
};

const EXPECTED_NODE_COUNT = DIAGRAM_FLOW.nodes.length;

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
  allNodesWithinCanvas: () => Promise<boolean>;
  zoomInGrowsScale: () => Promise<boolean>;
  zoomOutShrinksScale: () => Promise<boolean>;
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

      // Write the quest file as `approved` BEFORE navigating: an already-approved quest
      // loaded on initial navigation renders the spec panel directly. The Begin Quest
      // modal only pops up on a live WS transition INTO approved while the page is open
      // (see quest-approved-modal.e2e.ts), which is not the case here.
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
        flows: [DIAGRAM_FLOW],
      });

      const urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');
      await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

      await page
        .getByTestId('QUEST_SPEC_PANEL')
        .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
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
  };
};
