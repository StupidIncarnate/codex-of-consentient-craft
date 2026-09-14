import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-transcript-placeholder-no-bytes';
const PANEL_TIMEOUT = 8_000;
const BARE_PLACEHOLDER_CONTENT = '[Pasted Image 1]';

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('Transcript placeholder without bytes', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('EMPTY: {a bare placeholder with no markdown token and no bytes held by this tab} => renders one broken box, no image, and no images-route request', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Placeholder Without Bytes Branch Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const requests = images.recordImagesRequests({ page });

    const sessionId = `e2e-session-placeholder-bare-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: BARE_PLACEHOLDER_CONTENT });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    const brokenCount = await page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN').count();
    const imageCount = await page.getByTestId('CHAT_MESSAGE_IMAGE').count();

    expect({
      brokenCount,
      imageCount,
      imagesRouteRequests: Number(requests.getCount()),
    }).toStrictEqual({ brokenCount: 1, imageCount: 0, imagesRouteRequests: 0 });
  });

  test('VALID: {content "Before [Pasted Image 1] After"} => IMAGE_CONTENT_LAYER child order is exactly [text Before, the broken placeholder, text After]', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Placeholder Without Bytes Order Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-session-placeholder-order-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Before [Pasted Image 1] After' });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    const children = await images.readBubbleChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: 'Before ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      { tag: 'span', text: '', testId: 'CHAT_MESSAGE_IMAGE_BROKEN', src: '' },
      { tag: 'span', text: ' After', testId: 'CHAT_MESSAGE_TEXT', src: '' },
    ]);
  });

  test('VALID: {a bare placeholder mid-line, tab brought to front} => the broken box sits between the surrounding text, sized at brokenThumbnailSizePx', async ({
    page,
    request,
  }) => {
    const nav = navigationHarness({ page });
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Placeholder Without Bytes Geometry Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-session-placeholder-geometry-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Before [Pasted Image 1] After' });

    await nav.navigateToSession({ urlSlug, sessionId });
    await expect(page.getByTestId('CHAT_MESSAGE_IMAGE_BROKEN')).toHaveCount(1, {
      timeout: PANEL_TIMEOUT,
    });

    await page.bringToFront();
    await page.screenshot();
    const visibilityState = await page.evaluate(() => document.visibilityState);
    expect(visibilityState).toBe('visible');

    const children = await images.readBubbleChildren({ page });
    const sizePx = Number(images.getBrokenThumbnailSizePx());
    const box = await images.readBrokenThumbnailBoundingBox({ page });

    expect({ children, box }).toStrictEqual({
      children: [
        { tag: 'span', text: 'Before ', testId: 'CHAT_MESSAGE_TEXT', src: '' },
        { tag: 'span', text: '', testId: 'CHAT_MESSAGE_IMAGE_BROKEN', src: '' },
        { tag: 'span', text: ' After', testId: 'CHAT_MESSAGE_TEXT', src: '' },
      ],
      box: { width: sizePx, height: sizePx },
    });
  });
});
