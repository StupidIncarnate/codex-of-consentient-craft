import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  flowDiagramHarness,
  FLOW_DIAGRAM_OPEN_PAGE_LABEL,
  FLOW_DIAGRAM_GLUE_NODE_LABEL,
  FLOW_DIAGRAM_GLUE_UI_OBSERVABLE,
  FLOW_DIAGRAM_GLUE_API_OBSERVABLE,
  FLOW_DIAGRAM_UI_PACKAGE,
  FLOW_DIAGRAM_API_PACKAGE,
} from '../../../test/harnesses/flow-diagram/flow-diagram.harness';

const GUILD_PATH = '/tmp/dm-e2e-flow-node-packages';
const CARD_TIMEOUT = 10_000;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

// The package a node lands in is what the user reviews at the review_flows gate, so it has to be ON
// the diagram — not behind a click. These assertions are all about what a browser paints on the
// canvas, which is the only place the chip row, its colour and its effect on layout are real.
test.describe('Flow Node Packages', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {single-package node} => FLOW_NODE_PACKAGES renders exactly one chip naming its package', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Package Chip Guild' });

    const openPageCard = page
      .getByTestId('FLOW_NODE')
      .filter({ hasText: FLOW_DIAGRAM_OPEN_PAGE_LABEL });
    const chipRow = openPageCard.getByTestId('FLOW_NODE_PACKAGES');

    await expect(chipRow).toBeVisible({ timeout: CARD_TIMEOUT });
    await expect(chipRow.getByTestId('FLOW_NODE_PACKAGE_CHIP')).toHaveText([
      FLOW_DIAGRAM_UI_PACKAGE,
    ]);
  });

  // The whole point of the row. A glue node spans a package boundary, so its card must carry BOTH
  // chips — a reviewer who cannot see the second side cannot sign the seam off, and a one-chip check
  // stays green on a card that silently drops it.
  test('VALID: {glue node tagged with two packages} => its card renders TWO chips, one per package', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Glue Chip Guild' });

    const glueCard = page
      .getByTestId('FLOW_NODE')
      .filter({ hasText: FLOW_DIAGRAM_GLUE_NODE_LABEL });
    const glueChips = glueCard
      .getByTestId('FLOW_NODE_PACKAGES')
      .getByTestId('FLOW_NODE_PACKAGE_CHIP');

    await expect(glueChips).toHaveCount(2, { timeout: CARD_TIMEOUT });
    await expect(glueChips).toHaveText([FLOW_DIAGRAM_UI_PACKAGE, FLOW_DIAGRAM_API_PACKAGE]);
  });

  // Colour comes from the KIND declared in packagesAffected, never from the package's name. Asserted
  // through the data-package-type the card stamps beside the colour it paints, so a chip that
  // happened to look right by recognising a name would fail here.
  test('VALID: {glue node} => each chip carries the kind resolved from the quest, and the two kinds differ', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Chip Kind Guild' });

    const glueCard = page
      .getByTestId('FLOW_NODE')
      .filter({ hasText: FLOW_DIAGRAM_GLUE_NODE_LABEL });
    const uiChip = glueCard.getByTestId('FLOW_NODE_PACKAGE_CHIP').filter({
      hasText: FLOW_DIAGRAM_UI_PACKAGE,
    });
    const apiChip = glueCard.getByTestId('FLOW_NODE_PACKAGE_CHIP').filter({
      hasText: FLOW_DIAGRAM_API_PACKAGE,
    });

    await expect(uiChip).toHaveAttribute('data-package-type', 'frontend-react', {
      timeout: CARD_TIMEOUT,
    });
    await expect(apiChip).toHaveAttribute('data-package-type', 'http-backend');
  });

  // A glue node's assertion cards are the only surface that says WHICH side each criterion is read
  // on, so both sides have to be visible in its column.
  test('VALID: {glue node with one assertion per side} => each assertion card names its own package', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Assertion Package Guild' });

    const uiAssertion = page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .filter({ hasText: FLOW_DIAGRAM_GLUE_UI_OBSERVABLE });
    const apiAssertion = page
      .getByTestId('FLOW_OBSERVABLE_NODE')
      .filter({ hasText: FLOW_DIAGRAM_GLUE_API_OBSERVABLE });

    await expect(uiAssertion.getByTestId('FLOW_OBSERVABLE_NODE_PACKAGE')).toHaveText(
      FLOW_DIAGRAM_UI_PACKAGE,
      { timeout: CARD_TIMEOUT },
    );
    await expect(apiAssertion.getByTestId('FLOW_OBSERVABLE_NODE_PACKAGE')).toHaveText(
      FLOW_DIAGRAM_API_PACKAGE,
    );
  });

  // The layout half. ELK reserves each card a non-overlapping rectangle from an ESTIMATED height and
  // the card is pinned to that width with border-box, so a chip row added without growing the
  // estimate makes the taller cards cover their neighbours. Only a real browser resolves that, and
  // the seeded flow is deliberately the hard case: a two-chip terminal beside a four-card assertion
  // column, on the same ELK layer as its sibling terminal.
  test('VALID: {flow with a two-chip glue node} => no card on the canvas overlaps any other', async ({
    page,
    request,
  }) => {
    const diagram = flowDiagramHarness({ page, request, guildPath: GUILD_PATH, sessions });
    await diagram.seedAndOpen({ guildName: 'Chip Overlap Guild' });

    expect(await diagram.noCardOverlapsAnother()).toBe(true);
    // The flow-card-only check too, so a regression that only pushes cards into the assertion
    // column is told apart from one that piles the spine up.
    expect(await diagram.nodesDoNotOverlap()).toBe(true);
    // A chip row that clipped its overflow would hide the second package while still passing every
    // count above, so the labels are re-checked as fully painted alongside the geometry.
    expect(await diagram.nodeLabelsFullyVisible()).toBe(true);
  });
});
