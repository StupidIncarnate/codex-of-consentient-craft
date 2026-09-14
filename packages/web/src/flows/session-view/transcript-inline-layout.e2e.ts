import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';
import { transcriptInlineLayoutHarness } from '../../../test/harnesses/transcript-inline-layout/transcript-inline-layout.harness';

const GUILD_PATH = '/tmp/dm-e2e-transcript-inline-layout';
const PANEL_TIMEOUT = 8_000;
const IMAGE_SIZE_PX = 16;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });
const inlineLayout = transcriptInlineLayoutHarness();

test.describe('Transcript inline layout', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {content "A" + a pasted image token + "B"} => the image renders on the same line as the text before it, to its right', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Inline Layout Same Line Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'inline-same-line.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 11,
    });
    const content = images.buildTokenLine({
      segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
    });
    const sessionId = `e2e-session-inline-same-line-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, { timeout: PANEL_TIMEOUT });

    // A backgrounded tab reports a zero-ish box for everything, which reads exactly like the same
    // product bug this test is trying to prove — this preamble rules that out before measuring.
    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const displays = await inlineLayout.readSegmentDisplays({ page });
    expect(displays[1]).toStrictEqual({ testId: 'CHAT_MESSAGE_IMAGE', display: 'inline-block' });

    const geometry = await inlineLayout.readImageAfterTextGeometry({ page });
    expect(geometry).toStrictEqual({
      imageStartsRightOfTextEnd: true,
      verticalRangesOverlap: true,
    });
  });

  test('VALID: {content "A" + a pasted image token + "B"} => text written after the image continues on the same line, to its right', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Transcript Inline Layout Text Continues Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const seeded = images.seedImageFile({
      fileName: 'inline-text-continues.png',
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 12,
    });
    const content = images.buildTokenLine({
      segments: [{ text: 'A' }, { imagePath: String(seeded.imagePath), ordinal: 1 }, { text: 'B' }],
    });
    const sessionId = `e2e-session-inline-text-continues-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: String(content) });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE')).toHaveCount(1, { timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const geometry = await inlineLayout.readTextAfterImageGeometry({ page });
    expect(geometry).toStrictEqual({
      textStartsRightOfImageEnd: true,
      verticalRangesOverlap: true,
    });
  });
});
