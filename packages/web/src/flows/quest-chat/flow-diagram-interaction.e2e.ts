import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  flowDiagramHarness,
  FLOW_DIAGRAM_OPEN_PAGE_LABEL,
  FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE,
  LARGE_FLOW_FIRST_NODE_LABEL,
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
    // The full label must be shown on the card itself (no clamp), even for the long-label nodes.
    expect(await diagram.nodeLabelsFullyVisible()).toBe(true);
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

  test('VALID: {switch to second flow tab} => the second flow re-lays out (nodes distinct, no pile-up at 0,0)', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Tabs Guild' });

    await diagram.switchToSecondFlowTab();

    // Switching tabs must mount a fresh diagram and re-run ELK for the second flow's node ids;
    // otherwise every node falls back to {0,0} and piles up (distinct coords + overlap fail).
    expect(await diagram.hasExpectedSecondFlowNodeCount()).toBe(true);
    expect(await diagram.nodesHaveDistinctCoordinates()).toBe(true);
    expect(await diagram.nodesDoNotOverlap()).toBe(true);
  });

  test('VALID: {diagram rendered} => only the custom controls paint; native React Flow chrome stays out of the canvas', async ({
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
    // The attribution is the other piece of library chrome. It stays — dimmed onto the palette
    // rather than removed, so the credit is still there and still clickable.
    expect(await diagram.attributionIsDimmedNotHidden()).toBe(true);
  });

  // The floor case, at the suite's default 1280x720. After the page header, title bar, tab row,
  // pinned request, flow metadata and action bar there is nowhere near 420px left — so this is the
  // window where the diagram must refuse to shrink and hand the overflow to the tab's scrollbar.
  test('VALID: {spec panel opened in a short window} => the canvas holds its floor and the SPEC tab scrolls', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Floor Guild' });

    expect(await diagram.canvasKeepsFloorWhileSpecTabScrolls()).toBe(true);
  });

  test.describe('in a window with room to spare', () => {
    // Tall enough that the leftover beats the canvas floor, which is the only way to observe the
    // fill rule at all — at 720px the floor wins and the measurement below would describe it.
    test.use({ viewport: { width: 1280, height: 1100 } });

    test('VALID: {spec panel opened} => the canvas starts below the pinned user request and ends at the panel bottom', async ({
      page,
      request,
    }) => {
      const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
      await diagram.seedAndOpen({ guildName: 'Diagram Fill Guild' });

      // The SPEC tab's whole layout contract in one measurement: request on top, diagram taking
      // every remaining pixel. A canvas that pins its own height lands short of the panel edge or
      // past it, and neither shows up in jsdom — only a real browser resolves this chain.
      expect(await diagram.canvasFillsPanelBelowRequest()).toBe(true);
    });
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
    // The other branch carries a long condition. Its label must render IN FULL (the wrapping box
    // shows the trailing words, not an ellipsis) AND must not paint over the 'yes' label.
    expect(await diagram.branchLabelRendered({ label: 'terminates immediately' })).toBe(true);
    expect(await diagram.branchLabelsDoNotOverlap()).toBe(true);
  });

  test('VALID: {flow with observables} => each assertion renders as its own node branching to the right, no click needed', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Assertions Guild' });

    // Assertions are always visible on the canvas (no popup): the open-page observable renders as
    // its own FLOW_OBSERVABLE_NODE card, every observable gets one, and each branches off to the
    // RIGHT of its flow node without overlapping the spine.
    expect(await diagram.assertionNodeRendered({ text: FLOW_DIAGRAM_OPEN_PAGE_OBSERVABLE })).toBe(
      true,
    );
    expect(await diagram.hasExpectedAssertionCount()).toBe(true);
    expect(await diagram.assertionNodesBranchRightOfFlowNodes()).toBe(true);
  });

  test('VALID: {switch to large assertion-heavy flow} => the collapsed canvas top-anchors the entry node zoomed-in (not shrunk to fit)', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Large Guild' });
    await diagram.captureLoadZoom();
    await diagram.switchToLargeFlowTab();

    expect(await diagram.hasExpectedLargeFlowNodeCount()).toBe(true);
    // The load zoom frames ONE step of the flow, so this wide assertion-heavy graph loads at the
    // SAME zoom as the small flow above. A framing sized to the whole graph shrinks with every node
    // added, which is how a real quest flow ended up loading as a field of unreadable specks.
    expect(await diagram.loadZoomMatchesCapture()).toBe(true);
    // On load the collapsed canvas frames the graph top-anchored, horizontally centered on the
    // entry (first) node: the entry sits near the top AND on the canvas center line, so the reader
    // starts there. It must NOT be shrunk to fit the whole tall graph — the graph is zoomed-in and
    // therefore overflows the collapsed canvas downward (the reader scrolls for the rest), instead
    // of the entry node being a speck in the vertical middle.
    expect(await diagram.firstNodeNearCanvasTop({ label: LARGE_FLOW_FIRST_NODE_LABEL })).toBe(true);
    expect(
      await diagram.firstNodeHorizontallyCentered({ label: LARGE_FLOW_FIRST_NODE_LABEL }),
    ).toBe(true);
    expect(await diagram.graphExceedsCanvasHeight()).toBe(true);
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

    await diagram.captureNodeGeometry();

    // click-node branch: click the open-page node to open its detail panel.
    const openPageNode = page
      .getByTestId('FLOW_NODE')
      .filter({ has: page.getByText(FLOW_DIAGRAM_OPEN_PAGE_LABEL) });

    await openPageNode.click();

    // detail-shown terminal: the contracts-only panel opens with the node label as heading.
    const panel = page.getByTestId('FLOW_NODE_DETAIL_PANEL');

    await expect(panel).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(panel).toContainText(FLOW_DIAGRAM_OPEN_PAGE_LABEL);

    // The panel floats over the canvas, so the graph is exactly where the reviewer left it — the
    // next box they want is still under the cursor rather than shoved off the narrowed canvas.
    expect(await diagram.nodeGeometryMatchesCapture()).toBe(true);

    // selected-node-highlight: the clicked node is marked selected.
    await expect(openPageNode).toHaveAttribute('data-selected', 'true');

    // deselect-node action: close button dismisses the panel and clears the selection.
    await page.getByTestId('FLOW_DETAIL_PANEL_CLOSE').click();

    await expect(panel).toHaveCount(0);
    await expect(page.locator('[data-testid="FLOW_NODE"][data-selected="true"]')).toHaveCount(0);
  });
});
