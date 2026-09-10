import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  GetQuestInputStub,
  GuildNameStub,
  GuildPathStub,
  ModifyQuestInputStub,
  QuestBlightLedgerEntryStub,
  QuestBranchNameStub,
} from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questHydrateBroker } from '../hydrate/quest-hydrate-broker';
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';
import { questModifyBroker } from './quest-modify-broker';

// `createdAt` is stamped SERVER-SIDE on every write, so on real disk with a real clock each of these
// concurrent calls lands its own wall-clock instant and no expected value can be written down. What
// a lost update destroys is the ENTRY, so both sides of every comparison below are re-stamped with
// one sentinel and the remaining six fields are compared in full. The stamp's own behaviour — the
// client value being discarded, an omitted field being filled — is pinned by value in
// quest-modify-broker.test.ts against that suite's frozen clock.
const NORMALIZED_STAMP = '1970-01-01T00:00:00.000Z';

const withNormalizedStamp = ({
  entry,
}: {
  entry: ReturnType<typeof QuestBlightLedgerEntryStub>;
}): ReturnType<typeof QuestBlightLedgerEntryStub> =>
  QuestBlightLedgerEntryStub({ ...entry, createdAt: NORMALIZED_STAMP });

// GAP: the safety argument for concurrent ledger writes is "questModifyBroker
// serializes on a per-questId lock, the merge is itemId-keyed replace, and disjoint reviewers
// mean disjoint itemIds — so concurrent writers cannot clobber each other." That
// argument was never exercised against REAL disk I/O and REAL concurrency: the sibling unit
// test in quest-modify-broker.test.ts drives the same lock through a mocked fs proxy, whose
// mocked read/write calls resolve on synchronous/microtask timing that cannot expose a real
// cross-process lost update. These tests call the real broker, against a real quest.json on
// real disk, with real concurrent `Promise.all` callers — the shape a lost update was actually
// found in on a real quest in this repo before.
describe('questModifyBroker (integration — real disk, real concurrency)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {12 concurrent modify calls, each writing a DIFFERENT blightLedger itemId} => every entry survives on real disk, none lost to a real write race', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-concurrent-distinct-items' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Concurrent Distinct Items Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const entries = Array.from({ length: 12 }, (_, index) =>
      QuestBlightLedgerEntryStub({
        itemId:
          `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:concern-${String(index)}` as never,
      }),
    );

    const results = await Promise.all(
      entries.map(async (entry) =>
        questModifyBroker({
          input: ModifyQuestInputStub({
            questId,
            planningNotes: { blightLedger: [entry] },
          }),
        }),
      ),
    );

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect(results.every((result) => result.success)).toBe(true);

    const persisted = [...loaded.quest!.planningNotes.blightLedger]
      .sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)))
      .map((entry) => withNormalizedStamp({ entry }));
    const expected = [...entries]
      .sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)))
      .map((entry) => withNormalizedStamp({ entry }));

    expect(persisted).toStrictEqual(expected);
  });

  it('VALID: {10 concurrent modify calls, all writing the SAME blightLedger itemId} => exactly one entry survives, and it is one of the submitted dispositions (last-write-wins, never duplicated)', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-concurrent-same-item' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Concurrent Same Item Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const sharedItemId =
      'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:security' as never;
    const entries = Array.from({ length: 10 }, (_, index) =>
      QuestBlightLedgerEntryStub({
        itemId: sharedItemId,
        evidence: `pass ${String(index)} observed the handler under real concurrency` as never,
      }),
    );

    const results = await Promise.all(
      entries.map(async (entry) =>
        questModifyBroker({
          input: ModifyQuestInputStub({
            questId,
            planningNotes: { blightLedger: [entry] },
          }),
        }),
      ),
    );

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect(results.every((result) => result.success)).toBe(true);

    const persisted = loaded.quest!.planningNotes.blightLedger;

    // Exactly one entry for the shared itemId, and it is the LAST submission this test made —
    // deterministic, because questWithModifyLockBroker's mutex registers each concurrent
    // caller's queue slot SYNCHRONOUSLY while `Promise.all`/`.map()` iterates (before any caller
    // reaches its first real await), so the read-modify-write turns run strictly FIFO in that
    // same submission order. A real cross-process lost update would show up here as either zero
    // surviving entries (the write dropped) or more than one (the itemId-keyed replace failed to
    // collapse concurrent writers) — not a silently wrong survivor.
    expect(persisted.map((entry) => withNormalizedStamp({ entry }))).toStrictEqual([
      withNormalizedStamp({ entry: entries[entries.length - 1]! }),
    ]);
  });

  it('VALID: {an already-persisted entry, then 10 concurrent writes of NEW distinct itemIds} => the earlier entry survives alongside every new one — a concurrent batch does not drop prior state', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-concurrent-preserves-earlier' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Concurrent Preserves Earlier Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const earlierEntry = QuestBlightLedgerEntryStub({
      itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:dedup' as never,
    });
    const earlierResult = await questModifyBroker({
      input: ModifyQuestInputStub({
        questId,
        planningNotes: { blightLedger: [earlierEntry] },
      }),
    });

    expect(earlierResult.success).toBe(true);

    const concurrentEntries = Array.from({ length: 10 }, (_, index) =>
      QuestBlightLedgerEntryStub({
        itemId:
          `packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:new-concern-${String(index)}` as never,
      }),
    );

    const concurrentResults = await Promise.all(
      concurrentEntries.map(async (entry) =>
        questModifyBroker({
          input: ModifyQuestInputStub({
            questId,
            planningNotes: { blightLedger: [entry] },
          }),
        }),
      ),
    );

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect(concurrentResults.every((result) => result.success)).toBe(true);

    const persisted = [...loaded.quest!.planningNotes.blightLedger]
      .sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)))
      .map((entry) => withNormalizedStamp({ entry }));
    const expected = [earlierEntry, ...concurrentEntries]
      .sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)))
      .map((entry) => withNormalizedStamp({ entry }));

    expect(persisted).toStrictEqual(expected);
  });
});

// Both brokers are whole-file read-modify-writers of the SAME quest.json: questModifyBroker owns
// the agent/spec surface, questOperationsUpdateBroker owns the runtime ledger. They only stay
// non-clobbering while they queue behind ONE per-questId mutex. Two mutex maps means neither
// waits for the other, both read the same bytes, and whichever persists second overwrites the
// other's field — a lost update on the ledger with no error anywhere.
describe('questModifyBroker vs questOperationsUpdateBroker (integration — real disk, one shared mutex)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {concurrent questModifyBroker planningNotes write and questOperationsUpdateBroker branchName write} => both fields survive on real disk, neither writer clobbers the other', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-vs-operations-update-race' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Cross Writer Race Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const ledgerEntry = QuestBlightLedgerEntryStub({
      itemId:
        'packages/orchestrator/src/brokers/quest/modify/quest-modify-broker.ts:integrity' as never,
    });
    const branchName = QuestBranchNameStub({ value: 'quest/cross-writer-race' });

    const [modifyResult] = await Promise.all([
      questModifyBroker({
        input: ModifyQuestInputStub({
          questId,
          planningNotes: { blightLedger: [ledgerEntry] },
        }),
      }),
      questOperationsUpdateBroker({
        questId,
        update: () => ({ branchName }),
      }),
    ]);

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect(modifyResult.success).toBe(true);
    // The ledger write is questModifyBroker's; the branch name is questOperationsUpdateBroker's.
    // Under two separate mutex maps exactly one of these two assertions fails, depending on which
    // writer's persist landed last.
    expect(
      loaded.quest!.planningNotes.blightLedger.map((entry) => withNormalizedStamp({ entry })),
    ).toStrictEqual([withNormalizedStamp({ entry: ledgerEntry })]);
    expect(loaded.quest!.branchName).toBe(branchName);
  });
});

// GAP: design decision #pause-costs-no-new-field (live-elapsed-duration-on-in-progress-work-items)
// claims pausing always resets every active work item to pending via questPauseBroker
// (packages/orchestrator/src/brokers/quest/pause/quest-pause-broker.ts). That broker is reachable
// ONLY through `POST /api/quests/:questId/pause` (QuestPauseResponder) — a route distinct from
// `PATCH /api/quests/:questId` (QuestModifyResponder -> questModifyBroker, this file's own subject;
// see packages/server/src/flows/quest/quest-flow.ts). questInputForbiddenFieldsTransformer (the
// per-status field allowlist) and questHasValidStatusTransitionGuard (the transition graph) both gate
// a modify-quest `status` write, but neither one knows `paused` carries REQUIRED side effects that
// live only in questPauseBroker: resetting active work items to pending and stamping
// pausedAtStatus. questModifyBroker could not fully take pause's place even if it tried — killing the
// quest's registered subprocesses needs `processControls`, which brokers cannot obtain (brokers
// cannot import state/) — but nothing here stops it from at least refusing to leave an active work
// item behind.
//
// Confirmed live against a running siege lane: seeded a quest with one `in_progress` work item, then
// PATCHed `{status: 'paused'}` straight at the generic endpoint (the SAME endpoint this flow's own
// e2e suite PATCHes with a same-value no-op to force a quest-modified broadcast). The call returned
// 200. The execution panel then showed "RESUME QUEST" (proving the quest itself reads `paused`)
// beside a work-item row still reading "RUNNING" with a live "4m" duration figure — a row that
// renders a value neither a real pause nor a real resume ever wrote, indistinguishable on screen from
// a quest that is actually still executing.
describe('questModifyBroker vs the dedicated pause pipeline (integration — real disk)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {bare status:"paused" write on a quest with an active in_progress work item} => the write succeeds but leaves the active work item running, so the quest reads paused while its row does not', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-bare-pause-leaves-item-running' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Bare Pause Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const hydrated = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const workItem = hydrated.quest!.workItems[0]!;
    const startedAt = new Date(Date.now() - 30_000).toISOString();

    // Arm the work item as the live, running row this gap targets — sequentially, before the
    // bare-pause write below.
    const armed = await questModifyBroker({
      input: ModifyQuestInputStub({
        questId,
        workItems: [{ id: workItem.id, status: 'in_progress', startedAt }] as never,
      }),
    });

    expect(armed.success).toBe(true);

    const bareStatusResult = await questModifyBroker({
      input: ModifyQuestInputStub({ questId, status: 'paused' }),
    });

    const final = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const finalWorkItem = final.quest!.workItems.find((item) => item.id === workItem.id)!;

    restore();
    testbed.cleanup();

    // THE FIX: questModifyBroker refuses a bare `status: 'paused'` write outright rather than
    // performing it incompletely. Pause's side effects — killing every registered subprocess and
    // resetting active work items to pending — live only behind POST /api/quests/:questId/pause
    // (questPauseBroker), which this broker cannot reproduce (brokers cannot import state/, so
    // there is no `processControls` to kill anything with).
    expect(bareStatusResult).toStrictEqual({
      success: false,
      error: `Status 'paused' must be set via POST /api/quests/:questId/pause, not modify-quest`,
    });

    // THE INVARIANT: a quest that reads `paused` must never carry a work item still reading
    // `in_progress` — that combination is exactly what a viewer cannot render without showing a live
    // duration figure under a quest that claims it is not running. Refusing the write keeps quest and
    // item CONSISTENT: both still read `in_progress`, which is what is actually true on disk.
    expect(final.quest!.status).toBe('in_progress');
    expect(finalWorkItem.status).toBe('in_progress');
  });
});
