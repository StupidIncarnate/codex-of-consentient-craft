import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { stickyHeaderHarness } from '../../../test/harnesses/sticky-header/sticky-header.harness';

const GUILD_PATH = '/tmp/dm-e2e-sticky-expandable-headers';

// Outermost first. The execution row opens onto a sub-agent chain which itself opens onto a nested
// one, so the run is what proves the offsets COMPOUND rather than each level pinning at zero.
const NESTED_STACK = 'execution-row-header|SUBAGENT_CHAIN_HEADER|SUBAGENT_CHAIN_HEADER';

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Expandable headers stay reachable while their own body scrolls under them', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {scrolled to the foot of a nested sub-agent chain} => row and both chain headers pin as one contiguous stack, outermost on top', async ({
    page,
    request,
  }) => {
    const sticky = stickyHeaderHarness({ page, request, guildPath: GUILD_PATH, sessions });

    await sticky.seedNestedChainQuest({ guildName: 'Sticky Nested Guild' });
    await sticky.scrollTranscriptToFoot();

    // All three at once: the row a reader opened, the chain inside it, and the chain inside that.
    expect(await sticky.pinnedStackIs({ testIds: NESTED_STACK })).toBe(true);
    // No gap for the transcript to show through, no overlap eating a label.
    expect(await sticky.pinnedStackIsContiguous()).toBe(true);
    // The recursive case: two headers of the SAME kind, where a per-widget rank would tie and the
    // inner one would win on DOM order.
    expect(await sticky.pinnedStackPaintsOutermostOnTop()).toBe(true);
    expect(await sticky.pinnedHeadersOwnTheirPixels()).toBe(true);
    // Two of these are transparent unpinned; held out of flow they must not be.
    expect(await sticky.pinnedHeadersAreOpaque()).toBe(true);
  });

  test('VALID: {tool row left closed inside a pinned chain} => the closed row does not join the stack', async ({
    page,
    request,
  }) => {
    const sticky = stickyHeaderHarness({ page, request, guildPath: GUILD_PATH, sessions });

    await sticky.seedNestedChainQuest({ guildName: 'Sticky Closed Row Guild' });
    await sticky.scrollTranscriptToFoot();

    // A tool row declares `position: sticky` whether it is open or closed, on the reasoning that a
    // closed row's containing block IS its header so the declaration has nowhere to travel. If that
    // reasoning is wrong the row floats — a one-line bar with no body of its own, pinned over
    // content it does not own. The declared style is identical either way, so only the painted
    // stack can tell: the closed row appears as a fourth entry here and this fails.
    expect(await sticky.pinnedStackIs({ testIds: NESTED_STACK })).toBe(true);
  });
});
