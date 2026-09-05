import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { composerPasteHarness } from '../../../test/harnesses/composer-paste/composer-paste.harness';

// Proves the fix for the cross-composer draft leak: before scoping, the localStorage key and the
// IndexedDB image store were global singletons with no quest identity in them, so ANY composer's
// paste/type overwrote or leaked into any OTHER composer's draft — no second tab required, just a
// navigation from one quest to another. These specs drive that exact repro (one browser tab, two
// quests) and assert the CORRECT outcome: a quest that was never typed into opens its composer
// EMPTY, and a quest whose draft was composed earlier restores exactly ITS OWN text and image,
// unaffected by whatever was typed into a different quest's composer in between.
const GUILD_PATH = '/tmp/dm-e2e-composer-draft-quest-scoped';
const IMAGE_SIZE_PX = 20;
const PANEL_TIMEOUT = 10_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });
const sessions = wireHarnessLifecycle({
  harness: sessionHarness({ guildPath: GUILD_PATH }),
  testObj: test,
});

test.describe('Composer draft — scoped per quest, never leaks across a navigation', () => {
  test.beforeEach(async ({ page, request }) => {
    await guildHarness({ request }).cleanGuilds();
    // One-shot clear against an already-loaded origin, with NO init script left registered — see
    // composer-paste-draft-reload.e2e.ts's own beforeEach for why this matters for a later reload.
    await page.goto('/');
    await composerPasteHarness({ page }).clearDraftStorage();
  });

  test("VALID: {quest A composed, never sent} => navigating straight to quest B (never visited before) opens B's composer completely EMPTY", async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Scope Cross Quest Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionIdA = `e2e-draft-scope-a-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdA, userMessage: 'Build feature' });
    const createdA = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Scope Quest A',
      userRequest: 'Build feature',
    });
    const questIdA = String(createdA.questId);
    quests.writeQuestFile({
      questId: questIdA,
      questFolder: String(createdA.questFolder),
      questFilePath: String(createdA.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000f1',
          role: 'chaoswhisperer',
          sessionId: sessionIdA,
          status: 'complete',
        },
      ],
    });

    const sessionIdB = `e2e-draft-scope-b-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdB, userMessage: 'Build feature' });
    const createdB = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Scope Quest B',
      userRequest: 'Build feature',
    });
    const questIdB = String(createdB.questId);
    quests.writeQuestFile({
      questId: questIdB,
      questFolder: String(createdB.questFolder),
      questFilePath: String(createdB.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000f2',
          role: 'chaoswhisperer',
          sessionId: sessionIdB,
          status: 'complete',
        },
      ],
    });

    // Compose in quest A only — text plus an image — and never send it.
    await nav.navigateToQuest({ urlSlug, questId: questIdA });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await composer.focusComposer();
    await page.keyboard.type('DRAFT-FROM-QUEST-A ');
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 11,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    // Navigate straight to quest B, which nobody has ever typed into.
    await nav.navigateToQuest({ urlSlug, questId: questIdB });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    // #check-cross-quest-composer-opens-empty: quest B's composer carries NEITHER quest A's text
    // NOR its image — the bug this fix removes let quest A's whole draft leak straight in here.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(0);
    expect(await composer.readComposerTextContent()).toBe('');
    expect(await composer.readDraftText()).toBe(null);
    expect(await composer.readDraftImageRecords()).toStrictEqual([]);
  });

  test('VALID: {quest A composed, visit quest B, return to quest A} => quest A restores its OWN text and image, unaffected by the visit to quest B', async ({
    page,
    request,
  }) => {
    test.slow();

    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const composer = composerPasteHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Draft Scope Round Trip Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });
    const urlSlug = guilds.extractUrlSlug({ guild });

    const sessionIdA = `e2e-draft-scope-rt-a-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdA, userMessage: 'Build feature' });
    const createdA = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Scope Round Trip A',
      userRequest: 'Build feature',
    });
    const questIdA = String(createdA.questId);
    quests.writeQuestFile({
      questId: questIdA,
      questFolder: String(createdA.questFolder),
      questFilePath: String(createdA.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000f3',
          role: 'chaoswhisperer',
          sessionId: sessionIdA,
          status: 'complete',
        },
      ],
    });

    const sessionIdB = `e2e-draft-scope-rt-b-${Date.now()}`;
    sessions.createSessionFile({ sessionId: sessionIdB, userMessage: 'Build feature' });
    const createdB = await quests.createQuest({
      guildId: String(guildId),
      title: 'Draft Scope Round Trip B',
      userRequest: 'Build feature',
    });
    const questIdB = String(createdB.questId);
    quests.writeQuestFile({
      questId: questIdB,
      questFolder: String(createdB.questFolder),
      questFilePath: String(createdB.filePath),
      status: 'explore_flows',
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000f4',
          role: 'chaoswhisperer',
          sessionId: sessionIdB,
          status: 'complete',
        },
      ],
    });

    // Compose quest A's own draft.
    await nav.navigateToQuest({ urlSlug, questId: questIdA });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await composer.focusComposer();
    await page.keyboard.type('DRAFT-FROM-QUEST-A ');
    const dataUrlA = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 11,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlA) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    const [attachmentIdA] = await composer.readThumbnailAttachmentIds();
    const expectedBase64A = String(dataUrlA).slice(String(dataUrlA).indexOf(',') + 1);

    // Visit quest B and compose a DIFFERENT draft there — its own text, its own image.
    await nav.navigateToQuest({ urlSlug, questId: questIdB });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });
    await composer.focusComposer();
    await page.keyboard.type('DRAFT-FROM-QUEST-B ');
    const dataUrlB = await composer.buildImageDataUrl({
      widthPx: IMAGE_SIZE_PX,
      heightPx: IMAGE_SIZE_PX,
      seed: 44,
    });
    await composer.pasteImage({ dataUrl: String(dataUrlB) });
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);

    // Return to quest A.
    await nav.navigateToQuest({ urlSlug, questId: questIdA });
    await page.getByTestId('CHAT_INPUT').waitFor({ state: 'visible', timeout: PANEL_TIMEOUT });

    // #check-own-quest-draft-survives-foreign-visit: quest A restores its OWN text and its OWN
    // image (seed 11), not quest B's (seed 44) — the pre-fix behaviour let the LAST composer
    // written to anywhere clobber every quest's own key.
    await expect(page.getByTestId('CHAT_INPUT_THUMBNAIL')).toHaveCount(1);
    expect(await composer.readComposerTextContent()).toBe('DRAFT-FROM-QUEST-A ');
    expect(await composer.readDraftText()).toBe('DRAFT-FROM-QUEST-A [Pasted Image 1]');
    expect(await composer.readDraftImageRecords()).toStrictEqual([
      { attachmentId: attachmentIdA, mediaType: 'image/png', dataBase64: expectedBase64A },
    ]);
  });
});
