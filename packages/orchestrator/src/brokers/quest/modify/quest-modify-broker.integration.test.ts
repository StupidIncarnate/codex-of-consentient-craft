import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  GetQuestInputStub,
  GuildNameStub,
  GuildPathStub,
  ModifyQuestInputStub,
  QuestBlightLedgerEntryStub,
} from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questHydrateBroker } from '../hydrate/quest-hydrate-broker';
import { questModifyBroker } from './quest-modify-broker';

// GAP: the safety argument for parallel blightwarden minion writes is "questModifyBroker
// serializes on a per-questId lock, the merge is itemId-keyed replace, and disjoint minion
// groups mean disjoint itemIds — so concurrent writers cannot clobber each other." That
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

    const persisted = [...loaded.quest!.planningNotes.blightLedger].sort((a, b) =>
      String(a.itemId).localeCompare(String(b.itemId)),
    );
    const expected = [...entries].sort((a, b) => String(a.itemId).localeCompare(String(b.itemId)));

    expect(persisted).toStrictEqual(expected);
  });

  it('VALID: {10 concurrent modify calls, all writing the SAME blightLedger itemId} => exactly one entry survives, and it is one of the submitted dispositions (last-write-wins, never duplicated)', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-concurrent-same-item' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

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
    // deterministic, because withQuestModifyLockLayerBroker's mutex registers each concurrent
    // caller's queue slot SYNCHRONOUSLY while `Promise.all`/`.map()` iterates (before any caller
    // reaches its first real await), so the read-modify-write turns run strictly FIFO in that
    // same submission order. A real cross-process lost update would show up here as either zero
    // surviving entries (the write dropped) or more than one (the itemId-keyed replace failed to
    // collapse concurrent writers) — not a silently wrong survivor.
    expect(persisted).toStrictEqual([entries[entries.length - 1]]);
  });

  it('VALID: {an already-persisted entry, then 10 concurrent writes of NEW distinct itemIds} => the earlier entry survives alongside every new one — a concurrent batch does not drop prior state', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'modify-concurrent-preserves-earlier' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

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

    const persisted = [...loaded.quest!.planningNotes.blightLedger].sort((a, b) =>
      String(a.itemId).localeCompare(String(b.itemId)),
    );
    const expected = [earlierEntry, ...concurrentEntries].sort((a, b) =>
      String(a.itemId).localeCompare(String(b.itemId)),
    );

    expect(persisted).toStrictEqual(expected);
  });
});
