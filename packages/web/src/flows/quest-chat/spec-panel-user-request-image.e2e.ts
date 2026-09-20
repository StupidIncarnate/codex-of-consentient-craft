import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { transcriptImagesHarness } from '../../../test/harnesses/transcript-images/transcript-images.harness';

const GUILD_PATH = '/tmp/dm-e2e-spec-panel-user-request-image';
const PANEL_TIMEOUT = 10_000;
const SEED_WIDTH_PX = 16;
const SEED_HEIGHT_PX = 16;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});
const images = wireHarnessLifecycle({ harness: transcriptImagesHarness(), testObj: test });

test.describe('The quest spec panel renders the pinned user request through UserRequestLayerWidget', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    await page.goto('/');
  });

  test('VALID: {a userRequest token pointing at a real seeded file, then the file is deleted} => the SPEC tab paints it inline, and swaps to the broken placeholder once the source is gone', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const seeded = images.seedImageFile({
      fileName: 'a-user-request-screenshot.png',
      widthPx: SEED_WIDTH_PX,
      heightPx: SEED_HEIGHT_PX,
      seed: 1,
    });
    const originalImagePath = String(seeded.imagePath);
    const userRequest = String(
      images.buildTokenLine({
        segments: [
          { text: 'Look at ' },
          { imagePath: originalImagePath, ordinal: 1 },
          { text: ' and note what it shows' },
        ],
      }),
    );
    const expectedRequestText = 'Look at  and note what it shows';

    const guild = await guilds.createGuild({
      name: 'Spec Panel User Request Image Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-spec-panel-user-request-image-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Spec Panel User Request Image Quest',
      userRequest,
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      userRequest,
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000f101',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page
      .getByTestId('USER_REQUEST_TEXT')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    const visibilityStateBeforeLoad = await page.evaluate(() => document.visibilityState);
    expect(visibilityStateBeforeLoad).toBe('visible');

    await expect
      .poll(async () => images.readUserRequestImageNaturalWidth({ page, index: 0 }), {
        timeout: PANEL_TIMEOUT,
      })
      .toBe(SEED_WIDTH_PX);

    const expectedSrc = String(
      images.buildExpectedUserRequestImageSrc({ imagePath: originalImagePath }),
    );
    const loadedChildren = await images.readUserRequestChildren({ page });
    expect(loadedChildren).toStrictEqual([
      { tag: 'span', text: 'Look at ', testId: 'USER_REQUEST_TEXT_SEGMENT', src: '' },
      { tag: 'img', text: '', testId: 'USER_REQUEST_IMAGE', src: expectedSrc },
      {
        tag: 'span',
        text: ' and note what it shows',
        testId: 'USER_REQUEST_TEXT_SEGMENT',
        src: '',
      },
    ]);
    const loadedText = await images.readUserRequestText({ page });
    expect(loadedText).toBe(expectedRequestText);

    images.removeImageFile({ imagePath: originalImagePath });
    await page.reload();
    await page
      .getByTestId('USER_REQUEST_TEXT')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await page
      .getByTestId('USER_REQUEST_IMAGE_BROKEN')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    await page.bringToFront();
    await page.screenshot();
    const visibilityStateAfterBreak = await page.evaluate(() => document.visibilityState);
    expect(visibilityStateAfterBreak).toBe('visible');

    const brokenChildren = await images.readUserRequestChildren({ page });
    expect(brokenChildren).toStrictEqual([
      { tag: 'span', text: 'Look at ', testId: 'USER_REQUEST_TEXT_SEGMENT', src: '' },
      { tag: 'span', text: '', testId: 'USER_REQUEST_IMAGE_BROKEN', src: '' },
      {
        tag: 'span',
        text: ' and note what it shows',
        testId: 'USER_REQUEST_TEXT_SEGMENT',
        src: '',
      },
    ]);
    const brokenText = await images.readUserRequestText({ page });
    expect(brokenText).toBe(expectedRequestText);
  });

  test('VALID: {a userRequest with no image token} => the SPEC tab renders exactly one text segment holding it verbatim', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const userRequest = 'Add login with OAuth support for the settings page';

    const guild = await guilds.createGuild({
      name: 'Spec Panel Plain Request Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionId = `e2e-spec-panel-plain-request-${Date.now()}`;
    await sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await quests.createQuest({
      guildId: String(guildId),
      title: 'Spec Panel Plain Request Quest',
      userRequest,
    });
    const questId = String(created.questId);
    await quests.writeQuestFile({
      questId,
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'explore_flows',
      userRequest,
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-00000000f102',
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
    });

    await nav.navigateToQuest({ urlSlug, questId });
    await page
      .getByTestId('USER_REQUEST_TEXT')
      .waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    const children = await images.readUserRequestChildren({ page });
    expect(children).toStrictEqual([
      { tag: 'span', text: userRequest, testId: 'USER_REQUEST_TEXT_SEGMENT', src: '' },
    ]);
    const requestText = await images.readUserRequestText({ page });
    expect(requestText).toBe(userRequest);
  });
});
