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

  test('VALID: {ZOOM_IN then ZOOM_OUT} => viewport scale grows on zoom-in and shrinks on zoom-out', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Diagram Zoom Guild' });

    expect(await diagram.zoomInGrowsScale()).toBe(true);
    expect(await diagram.zoomOutShrinksScale()).toBe(true);
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
