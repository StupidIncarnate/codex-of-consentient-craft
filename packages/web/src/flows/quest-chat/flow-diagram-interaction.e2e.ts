import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  flowDiagramHarness,
  FLOW_DIAGRAM_OPEN_PAGE_LABEL,
  FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE,
} from '../../../test/harnesses/flow-diagram/flow-diagram.harness';

const GUILD_PATH = '/tmp/dm-e2e-flow-diagram-interaction';
const PANEL_TIMEOUT = 5_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Flow Diagram Interaction', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {flow with 3 nodes rendered in browser} => no two FLOW_NODE boxes overlap or share coordinates', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Overlap Guild' });

    expect(await diagram.hasExpectedNodeCount()).toBe(true);
    expect(await diagram.nodesHaveDistinctCoordinates()).toBe(true);
    expect(await diagram.nodesDoNotOverlap()).toBe(true);
  });

  test('VALID: {FIT_VIEW_BUTTON clicked} => every FLOW_NODE is within the visible canvas bounds', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Fit Guild' });

    await page.getByTestId('FIT_VIEW_BUTTON').click();

    expect(await diagram.allNodesWithinCanvas()).toBe(true);
  });

  test('VALID: {diagram rendered} => only the custom controls paint; native React Flow controls stay hidden', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Controls Guild' });

    // Exactly one visible control cluster: the custom RPG buttons. The native React Flow
    // controls must remain in the DOM (they are the zoom/fit actuators) but must not paint, or
    // two control clusters overlap.
    expect(await diagram.customControlsVisible()).toBe(true);
    expect(await diagram.nativeControlsPresentButHidden()).toBe(true);
  });

  test('VALID: {FULLSCREEN_BUTTON clicked} => canvas grows to a tall definite height with nodes still framed', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Fullscreen Guild' });

    await diagram.expandToFullscreen();

    // Expanding must resolve a tall definite canvas height (the black-screen bug collapses it to
    // 0px) and re-fit so every node stays inside the now-taller viewport.
    expect(await diagram.expandedCanvasIsTall()).toBe(true);
    expect(await diagram.allNodesWithinCanvas()).toBe(true);
  });

  test('VALID: {ZOOM_IN then ZOOM_OUT} => viewport scale grows on zoom-in and shrinks on zoom-out', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Zoom Guild' });

    expect(await diagram.zoomInGrowsScale()).toBe(true);
    expect(await diagram.zoomOutShrinksScale()).toBe(true);
  });

  test('VALID: {flow rendered in browser} => REACT_FLOW_CANVAS has a non-zero renderable height', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Height Guild' });

    // The canvas wrapper must resolve a definite height; a maxHeight-only wrapper collapses
    // the React Flow canvas to 0px and the diagram is unusable despite nodes existing.
    expect(await diagram.canvasHasRenderableHeight()).toBe(true);
  });

  test('VALID: {flow with edges rendered in browser} => one edge path per flow edge with branch labels visible', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Edges Guild' });

    // Custom node cards must expose React Flow handles or every edge is dropped. Assert the
    // edges render AND the labeled branch ('yes') paints its label text.
    expect(await diagram.allEdgesRendered()).toBe(true);
    expect(await diagram.branchLabelRendered({ label: 'yes' })).toBe(true);
    // The other branch carries a long condition; its label must be bounded so it does not paint
    // over the 'yes' label.
    expect(await diagram.branchLabelsDoNotOverlap()).toBe(true);
  });

  test('VALID: {node selected then canvas background clicked} => pane click deselects and closes the panel', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Pane Deselect Guild' });

    const openPageNode = page
      .getByTestId('FLOW_NODE')
      .filter({ has: page.getByText(FLOW_DIAGRAM_OPEN_PAGE_LABEL) });

    await openPageNode.click();

    const panel = page.getByTestId('FLOW_NODE_DETAIL_PANEL');
    await expect(panel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(openPageNode).toHaveAttribute('data-selected', 'true');

    // Clicking the canvas pane background must dismiss the panel via React Flow's onPaneClick.
    await diagram.clickPaneBackground();

    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-testid="FLOW_NODE"][data-selected="true"]')).toHaveCount(0);
  });

  test('VALID: {node clicked then detail panel closed} => panel opens with node label and closes on deselect', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Panel Guild' });

    // diagram-only terminal: no detail panel before any node is clicked.
    await expect(page.getByTestId('FLOW_NODE_DETAIL_PANEL')).toHaveCount(0);

    // click-node branch: click the node that carries observables so the panel has content.
    const openPageNode = page
      .getByTestId('FLOW_NODE')
      .filter({ has: page.getByText(FLOW_DIAGRAM_OPEN_PAGE_LABEL) });

    await openPageNode.click();

    // detail-shown terminal: panel opens with the node label as heading and its observable.
    const panel = page.getByTestId('FLOW_NODE_DETAIL_PANEL');

    await expect(panel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(panel).toContainText(FLOW_DIAGRAM_OPEN_PAGE_LABEL);
    await expect(panel).toContainText(FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE);

    // selected-node-highlight: the clicked node is marked selected.
    await expect(openPageNode).toHaveAttribute('data-selected', 'true');

    // deselect-node action: close button dismisses the panel and clears the selection.
    await page.getByTestId('FLOW_DETAIL_PANEL_CLOSE').click();

    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-testid="FLOW_NODE"][data-selected="true"]')).toHaveCount(0);
  });
});
