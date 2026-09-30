import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';

import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { subagentLaunchOrderHarness } from '../../../test/harnesses/subagent-launch-order/subagent-launch-order.harness';

const GUILD_PATH = '/tmp/dm-e2e-nested-subagent-launch-order';

// The parent sub-agent's own two lines, its background launch, and the acknowledgement that launch
// returned — in the order the launch happened. A chain painted where it fired sits between the line
// before it and the acknowledgement it produced.
const EXPECTED_ORDER = 'parentBefore|nestedChain|asyncAck|parentAfter';

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A background sub-agent renders where it was launched, not at the end of its parent', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {sub-agent A launches a background agent B between two of its own lines} => chain B paints between them, above A later entries', async ({
    page,
    request,
  }) => {
    const launches = subagentLaunchOrderHarness({ page, request, guildPath: GUILD_PATH, sessions });

    await launches.seedBackgroundLaunchQuest({ guildName: 'Background Launch Order Guild' });
    await launches.revealParentChainEntries();

    expect(await launches.paintedOrderInParentChainIs({ order: EXPECTED_ORDER })).toBe(true);
  });
});
