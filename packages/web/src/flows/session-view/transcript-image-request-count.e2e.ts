import { UserTextStringStreamLineStub } from '@dungeonmaster/shared/contracts';

import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

// Both cases here are about COUNTS, not content: one real image must be fetched exactly once and
// actually decode (never a silent re-fetch, never a request that resolved but painted nothing), and
// two distinct messages must never have their images pooled into one bubble. Neither claim is
// checkable against a single point-in-time "an image is visible somewhere" read.
const GUILD_PATH = '/tmp/dm-e2e-transcript-image-request-count';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Transcript image request count', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {one session message carrying one real 18x18 PNG token} => the image element requests its src exactly once and paints the returned bytes', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Request Count Once Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'requested-once.png',
      widthPx: 18,
      heightPx: 18,
      seed: 51,
    });
    const content = images.buildTokenLine({
      segments: [{ imagePath: String(seeded.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-request-count-once-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    const expectedUrl = String(
      images.buildExpectedImageUrl({ imagePath: String(seeded.imagePath) }),
    );
    const requests = images.recordImagesRequests({ page });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1);

    await expect.poll(async () => images.readNaturalWidth({ page, index: 0 })).toBe(18);

    const requestsForThatUrl = Number(requests.countResponsesFor({ url: expectedUrl }));
    const naturalWidth = Number(await images.readNaturalWidth({ page, index: 0 }));

    expect({ requestsForThatUrl, naturalWidth }).toStrictEqual({
      requestsForThatUrl: 1,
      naturalWidth: 18,
    });
  });

  test('VALID: {two user messages, each carrying one byte-distinct real PNG token} => each bubble renders exactly one image element, and the two elements carry distinct srcs', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Image Request Count Per-Bubble Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const first = images.seedImageFile({
      fileName: 'per-bubble-first.png',
      widthPx: 18,
      heightPx: 18,
      seed: 51,
    });
    const second = images.seedImageFile({
      fileName: 'per-bubble-second.png',
      widthPx: 26,
      heightPx: 26,
      seed: 52,
    });

    const firstContent = images.buildTokenLine({
      segments: [{ imagePath: String(first.imagePath), ordinal: 1 }],
    });
    const secondContent = images.buildTokenLine({
      segments: [{ imagePath: String(second.imagePath), ordinal: 1 }],
    });

    const sessionId = `e2e-session-request-count-per-bubble-${Date.now()}`;
    sessions.createMultiEntrySessionFile({
      sessionId,
      lines: [
        JSON.stringify(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: String(firstContent) },
          }),
        ),
        JSON.stringify(
          UserTextStringStreamLineStub({
            message: { role: 'user', content: String(secondContent) },
          }),
        ),
      ],
    });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE')).toHaveCount(2);

    const firstBubbleImageElements = await page
      .getByTestId('CHAT_MESSAGE')
      .nth(0)
      .locator('[data-testid="CHAT_MESSAGE_IMAGE"], [data-testid="CHAT_MESSAGE_IMAGE_BROKEN"]')
      .count();
    const secondBubbleImageElements = await page
      .getByTestId('CHAT_MESSAGE')
      .nth(1)
      .locator('[data-testid="CHAT_MESSAGE_IMAGE"], [data-testid="CHAT_MESSAGE_IMAGE_BROKEN"]')
      .count();
    const firstSrc = await page
      .getByTestId('CHAT_MESSAGE')
      .nth(0)
      .getByTestId('CHAT_MESSAGE_IMAGE')
      .getAttribute('src');
    const secondSrc = await page
      .getByTestId('CHAT_MESSAGE')
      .nth(1)
      .getByTestId('CHAT_MESSAGE_IMAGE')
      .getAttribute('src');

    expect({
      firstBubbleImageElements,
      secondBubbleImageElements,
      srcsAreDistinct: firstSrc !== secondSrc,
    }).toStrictEqual({
      firstBubbleImageElements: 1,
      secondBubbleImageElements: 1,
      srcsAreDistinct: true,
    });
  });
});
