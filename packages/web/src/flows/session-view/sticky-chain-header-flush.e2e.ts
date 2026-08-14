import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { stickyHeaderHarness } from '../../../test/harnesses/sticky-header/sticky-header.harness';

const GUILD_PATH = '/tmp/dm-e2e-sticky-chain-header-flush';

// On the chat surface there is no execution row above it, so the chain is the outermost expandable
// and pins at zero. The nested chain inside it clears that header.
const CHAT_STACK = 'SUBAGENT_CHAIN_HEADER|SUBAGENT_CHAIN_HEADER';

const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('A chain header on the chat surface pins flush with the top of the transcript', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {scrolled into a sub-agent chain} => its header pins at the scrollport top, not below the panel inset', async ({
    page,
    request,
  }) => {
    const sticky = stickyHeaderHarness({ page, request, guildPath: GUILD_PATH, sessions });

    await sticky.seedChatPanelChain({ guildName: 'Sticky Chat Guild' });
    await sticky.scrollTranscriptToFoot();

    // The regression this owns: a sticky child pins to its scrollport's CONTENT edge, so any
    // `padding-top` on the transcript container holds every header that far down while the
    // transcript keeps scrolling through the strip above it. The inset belongs on the content.
    expect(await sticky.topPinnedHeaderIsFlushWithScrollportTop()).toBe(true);
    expect(await sticky.pinnedStackIs({ testIds: CHAT_STACK })).toBe(true);
    expect(await sticky.pinnedStackIsContiguous()).toBe(true);
    expect(await sticky.pinnedStackPaintsOutermostOnTop()).toBe(true);
    expect(await sticky.pinnedHeadersAreOpaque()).toBe(true);
  });
});
