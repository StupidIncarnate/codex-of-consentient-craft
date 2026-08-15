import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';

const GUILD_PATH = '/tmp/dm-e2e-quest-begin-transition';
const MODAL_TIMEOUT = 5_000;
const PANEL_TIMEOUT = 5_000;
const REQUEST_TIMEOUT = 3000;
const IN_PROGRESS_TIMEOUT = 10_000;
const HTTP_OK = 200;

// A feature quest reaches the observables gate carrying NO ledger of its own: `operations` is off
// the modify-quest allowlist for every role at every status, so ChaosWhisperer authors none of it,
// and the `approved` gate measures non-empty `flows` and nothing else. Start is the one thing that
// mints a ledger — the riftcarver carve at its head, then the codeweaver items derived from the
// flows' package tags, then the fixed verify tail — which is why every relay assertion in this file
// reads the ledger Start produced rather than one the fixture handed it.
const CHAOSWHISPERER_WORK_ITEM_ID = 'e2e00000-0000-4000-8000-000000000001';

const sessions = sessionHarness({ guildPath: GUILD_PATH });
const environment = environmentHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environment, testObj: test });

test.describe('Quest Begin Transition', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: clicking Begin Quest sends POST to /start and transitions the quest to in_progress', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Begin Transition Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-begin-transition-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    // Create quest via API to get the server-resolved file path
    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Begin Transition Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    // Overwrite quest.json with the desired status. The ledger stays empty — the flows the harness
    // seeds are the whole of what the observables gate measures, and the APPROVE button follows it.
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: CHAOSWHISPERER_WORK_ITEM_ID,
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
      operations: [],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click APPROVE — drives review_observables → approved through the real UI flow. The button is
    // enabled because the quest carries flows, which is the whole of the observables gate.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Begin Quest must POST to the quest start endpoint (which seeds the operations relay
    // via OrchestrationStartResponder). A PATCH to the modify endpoint would skip the relay
    // seed — the H-1 root cause bug.
    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    const startRequest = await startPromise;

    expect(startRequest.method()).toBe('POST');
    expect(startRequest.url()).toContain(`/api/quests/${questId}/start`);
    // start-post-fired: BEGIN QUEST sends no request body — the questId travels in the URL only.
    expect(startRequest.postData()).toBe(null);

    // The modal is held open across the POST with its Begin Quest button disabled, and closes on
    // success — so its disappearance is the request resolving, not the click.
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // start-quest transitions the approved feature quest straight to in_progress and seeds the
    // operations relay; OrchestrationStartResponder spawns nothing (the active dispatcher picks it
    // up). The UI MUST still swap the spec panel for the execution panel live via the quest-modified
    // WS event (in_progress renders the execution panel) — no page reload required.
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    // UI panel swap must happen live (WS-driven) — no reload.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    // The seeded operations relay renders as the ledger inside the execution panel.
    await expect(page.getByTestId('OPERATIONS_LEDGER')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: Begin Quest from review_observables transitions to in_progress, promotes chaoswhisperer, and seeds the operations relay', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Execution Roles Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-exec-roles-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Execution Roles Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    // Chaoswhisperer starts as 'pending' — matches real quest data where
    // the spec phase never explicitly marks the work item complete.
    // The OrchestrationStartResponder must promote it to 'complete' on quest start.
    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: CHAOSWHISPERER_WORK_ITEM_ID,
          role: 'chaoswhisperer',
          sessionId,
          status: 'pending',
        },
      ],
      operations: [],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // Click APPROVE — drives review_observables → approved through the real UI flow,
    // which triggers the quest-modified WS broadcast that surfaces the Begin Quest modal.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // Click Begin Quest — POST to quest start endpoint
    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    await startPromise;

    // Modal should close
    await expect(page.getByText('Shall we go dumpster diving for some code?')).not.toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    // start-quest transitions the approved feature quest to in_progress and seeds the relay
    // (no dispatcher runs in e2e). We assert three OrchestrationStartResponder effects on the
    // persisted quest:
    //   1. status is set to in_progress
    //   2. the pending chaoswhisperer work item is promoted to complete
    //   3. the operations relay is seeded, with the riftcarver carve at its head and exactly one
    //      work item minted for it
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const chaoswhispererItem = questData.quest.workItems.find(
      (wi: { role: string }) => wi.role === 'chaoswhisperer',
    );
    const riftcarverItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'riftcarver',
    );

    expect(chaoswhispererItem.status).toBe('complete');
    // The carve is the HEAD of the seeded ledger and the item the relay marks actionable. Asserted
    // as the whole first entry, sliced rather than indexed: a `some(role === 'riftcarver')` check
    // passes just as happily on a ledger that buried the carve behind a codeweaver, which is the
    // arrangement that would send an agent into the repo-root checkout.
    expect(
      questData.quest.operations
        .slice(0, 1)
        .map((op: { role: string; status: string }) => ({ role: op.role, status: op.status })),
    ).toStrictEqual([{ role: 'riftcarver', status: 'in_progress' }]);
    // One assertion carries three facts: EXACTLY one riftcarver work item exists (strict 1:1 with
    // its operation item), it is the dispatcher's to run rather than Claude's, and it is chained
    // behind the intake session.
    expect(
      riftcarverItems.map((wi: { spawnerType: string; dependsOn: string[] }) => ({
        spawnerType: wi.spawnerType,
        dependsOn: wi.dependsOn,
      })),
    ).toStrictEqual([{ spawnerType: 'command', dependsOn: [CHAOSWHISPERER_WORK_ITEM_ID] }]);
  });

  test('VALID: Begin Quest seeds the operations relay and its first work item into quest.json', async ({
    page,
    request,
  }) => {
    // Under the `/dumpster-launch` model, Begin Quest mutates quest state only —
    // OrchestrationStartResponder calls questBuildRelayGraphBroker to seed the operations relay
    // (the riftcarver carve, the derived codeweaver items and the fixed verify tail), promotes the
    // chaoswhisperer chat item to complete, creates the FIRST work item for the first actionable
    // operation, and transitions the quest approved → in_progress. The orchestrator does NOT spawn
    // anything; `/dumpster-launch` running in the user's Claude session calls get-next-step() to
    // pick the work up on its next pass. This test exercises the post-Begin-Quest persisted graph
    // shape (the seeded ledger + its first work item).
    const guild = await guildHarness({ request }).createGuild({
      name: 'Relay Graph Begin Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-relay-graph-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Relay Graph Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: CHAOSWHISPERER_WORK_ITEM_ID,
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
      operations: [],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // APPROVE → modal appears.
    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByText('Shall we go dumpster diving for some code?')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    const startPromise = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes(`/api/quests/${questId}/start`),
      { timeout: REQUEST_TIMEOUT },
    );

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    await startPromise;

    // Wait for in_progress — proves OrchestrationStartResponder finished its relay seed + status
    // transition (approved → in_progress). Start spawns nothing; the active dispatcher picks it up.
    await expect
      .poll(
        async () => {
          const response = await request.get(`/api/quests/${questId}`);
          if (response.status() !== HTTP_OK) {
            return null;
          }
          const data = await response.json();
          return data.quest.status;
        },
        { timeout: IN_PROGRESS_TIMEOUT },
      )
      .toBe('in_progress');

    // Inspect the persisted work-item graph. The relay seed creates a single first work item, for
    // the riftcarver operation item at the head of the ledger; it depends on the prior chat work
    // item (chaoswhisperer here) and links 1:1 to its operation item via
    // relatedDataItems: ['operations/<id>'].
    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();
    const riftcarverItems = questData.quest.workItems.filter(
      (wi: { role: string }) => wi.role === 'riftcarver',
    );
    const [headOperation] = questData.quest.operations;

    expect(headOperation.role).toBe('riftcarver');
    // The 1:1 link is asserted against the head operation's OWN id, so a work item pointing at some
    // other item on the ledger fails here rather than passing on a well-formed-looking ref.
    expect(
      riftcarverItems.map(
        (wi: { dependsOn: string[]; relatedDataItems: string[]; spawnerType: string }) => ({
          dependsOn: wi.dependsOn,
          relatedDataItems: wi.relatedDataItems,
          spawnerType: wi.spawnerType,
        }),
      ),
    ).toStrictEqual([
      {
        dependsOn: [CHAOSWHISPERER_WORK_ITEM_ID],
        relatedDataItems: [`operations/${String(headOperation.id)}`],
        spawnerType: 'command',
      },
    ]);

    // UI panel swap mirrors the other tests in this file.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).not.toBeVisible();
  });

  test('VALID: {Begin Quest clicked} => the execution panel replaces the spec panel while the repo still holds no worktree', async ({
    page,
    request,
  }) => {
    // THE REPORTED SYMPTOM THIS GUARDS: clicking Begin Quest looked like nothing happened — the
    // spec panel kept rendering for minutes while POST /start sat pending, because the request
    // carried the whole git lifecycle (worktree add, node_modules mirror, preflight build) and the
    // quest-modified WS event that drives the panel swap cannot fire until that lands. The sibling
    // tests above prove the swap is WS-driven; this one proves it happens BEFORE any carving,
    // which is the half that was broken.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Carve On Relay Guild',
      path: GUILD_PATH,
    });
    const guildId = String(guild.id);
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });
    const sessionId = `e2e-carve-on-relay-${Date.now()}`;
    sessions.createSessionFile({ sessionId, userMessage: 'Build the feature' });

    const created = await questHarness({ request }).createQuest({
      guildId,
      title: 'E2E Carve On Relay Quest',
      userRequest: 'Build the feature',
    });
    const { questId } = created;
    const { questFolder } = created;
    const questFilePath = created.filePath;

    quests.writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      status: 'review_observables',
      workItems: [
        {
          id: CHAOSWHISPERER_WORK_ITEM_ID,
          role: 'chaoswhisperer',
          sessionId,
          status: 'complete',
        },
      ],
      operations: [],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(questId) });

    const specPanel = page.getByTestId('QUEST_SPEC_PANEL');
    await expect(specPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The guild path is a real git repo (environmentHarness builds it), so `worktrees/` is a
    // directory a carve genuinely can create here. Reading it before the click is what makes the
    // reading after the click mean something: the two together say the click created none.
    expect(environment.listWorktreeDirNames()).toStrictEqual([]);

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'APPROVE' }).click();

    await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).toBeVisible({
      timeout: MODAL_TIMEOUT,
    });

    await page.getByTestId('PIXEL_BTN').filter({ hasText: 'Begin Quest' }).click();

    // Promptly, off the quest-modified WS event, with no reload: POST /start is pure quest.json
    // bookkeeping, so it answers in milliseconds. A carve back inside the request blows this
    // timeout outright — `git worktree add` plus the node_modules mirror plus the preflight build
    // take minutes on a real repo.
    await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
      timeout: PANEL_TIMEOUT,
    });

    // THE POINT OF THIS TEST, read at the moment the execution panel is up. `worktrees/` is the
    // ENTIRE surface a carve can land on in this repo, so an empty list here says the panel swapped
    // before anything was carved — which is exactly what the reported symptom got backwards.
    expect(environment.listWorktreeDirNames()).toStrictEqual([]);

    await expect(specPanel).not.toBeVisible();

    // ...and the carve is QUEUED rather than gone. Paired with the empty listing above, this is
    // what separates "the carve moved onto the relay" from "the carve was deleted": the ledger's
    // head is the riftcarver item, marked actionable, with its own command work item waiting for a
    // dispatcher that has not run yet.
    const questResponse = await request.get(`/api/quests/${questId}`);
    const questData = await questResponse.json();

    expect(
      questData.quest.operations
        .slice(0, 1)
        .map((op: { role: string; status: string }) => ({ role: op.role, status: op.status })),
    ).toStrictEqual([{ role: 'riftcarver', status: 'in_progress' }]);
    expect(
      questData.quest.workItems
        .filter((wi: { role: string }) => wi.role === 'riftcarver')
        .map((wi: { status: string; spawnerType: string }) => ({
          status: wi.status,
          spawnerType: wi.spawnerType,
        })),
    ).toStrictEqual([{ status: 'pending', spawnerType: 'command' }]);
  });
});
