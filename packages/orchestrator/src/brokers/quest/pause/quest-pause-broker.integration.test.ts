import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  GetQuestInputStub,
  GuildNameStub,
  GuildPathStub,
  ModifyQuestInputStub,
  QuestStatusStub,
} from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questHydrateBroker } from '../hydrate/quest-hydrate-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questPauseBroker } from './quest-pause-broker';

// No subprocess ever registers for either racer in this suite, so a no-op pair is the honest
// stand-in for the real `orchestrationProcessesState` methods questPauseBroker takes as a
// parameter (brokers cannot import state/ — see this broker's own header).
const buildNoopProcessControls = (): {
  findAllByQuestId: () => never[];
  kill: () => undefined;
} => ({
  findAllByQuestId: () => [],
  kill: () => undefined,
});

// GAP: design decision #pause-costs-no-new-field (live-elapsed-duration-on-in-progress-work-items)
// claims paused time is excluded from the elapsed-duration row purely by EXISTING bookkeeping —
// pause flips every active work item to pending, no new field needed — with no caveat about more
// than one caller. That argument was only ever exercised against a single request. Confirmed live
// against a running siege lane first (two genuinely concurrent POST /pause calls via Node's
// `fetch`, not two sequential curls): one racer gets `{paused:true}` and the OTHER gets a 500,
// `{"error":"Failed to pause quest: <id>"}`. quest.json itself lands valid and in the single
// correct state (status: paused, the work item: pending) — the bug is not corruption, it is that
// the SECOND caller's request fails outright.
//
// Root cause: questPauseBroker takes no lock of its own. It reads the quest (questGetBroker), then
// calls questModifyBroker, which DOES lock — but only around its own fresh read/merge/write, not
// around the snapshot questPauseBroker already took before calling it. Two callers racing the same
// quest both read 'in_progress' and both proceed; whichever's questModifyBroker call enters the
// lock SECOND re-reads a quest already at 'paused' and attempts the self-transition
// paused -> paused, which questStatusTransitionsStatics.paused does not list (unlike in_progress /
// blocked / merging, which each self-loop deliberately for exactly this reason). That racer's
// modify call returns { success: false, error: 'Invalid status transition: paused -> paused' },
// so questPauseBroker returns { paused: false } instead of the idempotent { paused: true } a
// genuine double-submit should produce.
describe('questPauseBroker (integration — real disk, real concurrency)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {2 concurrent pause calls on the same in_progress quest, one running work item} => both callers get {paused:true}, and the quest lands paused with that work item pending', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'pause-concurrent-double-submit' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Pause Double Submit Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const hydrated = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const workItem = hydrated.quest!.workItems[0]!;
    const startedAt = new Date(Date.now() - 30_000).toISOString();

    // Arm ONE work item as the live, running row this stress point targets — status in_progress,
    // startedAt ~30s in the real past — sequentially, before the race starts.
    const armed = await questModifyBroker({
      input: ModifyQuestInputStub({
        questId,
        workItems: [{ id: workItem.id, status: 'in_progress', startedAt }] as never,
      }),
    });

    expect(armed.success).toBe(true);

    const results = await Promise.all([
      questPauseBroker({
        questId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls: buildNoopProcessControls(),
      }),
      questPauseBroker({
        questId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls: buildNoopProcessControls(),
      }),
    ]);

    const final = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    // The part of the design decision that DOES hold: quest.json stays valid and lands in the
    // single correct paused state, whichever racer's write actually persisted.
    expect(final.quest!.status).toBe('paused');
    expect(final.quest!.workItems.find((item) => item.id === workItem.id)!.status).toBe('pending');

    // The part that does not: a genuine double-submit should be idempotent for BOTH callers.
    expect(results).toStrictEqual([{ paused: true }, { paused: true }]);
  });

  // GAP: design decision #pause-costs-no-new-field (live-elapsed-duration-on-in-progress-work-items)
  // — a SECOND, independent way to falsify it, distinct from the concurrent-double-pause race
  // above. A resume re-dispatches a work item ASYNCHRONOUSLY: the HTTP response returns once the
  // quest's own status flips back to in_progress, and only LATER does spawnBatchLayerBroker's
  // pre-stamp (questModifyBroker with a fresh startedAt) actually land. questPauseBroker reads its
  // "which items are active" snapshot via an un-locked questGetBroker call BEFORE it ever reaches
  // questModifyBroker's lock. If that snapshot read wins the race against the pre-stamp write (the
  // pre-stamp needs its own lock-acquire + read + merge + persist round trip; the snapshot is one
  // bare read), the snapshot sees the item still `pending` — not `isActiveWorkItemStatusGuard` —
  // so questPauseBroker's own modify call carries NO `workItems` patch at all. The pre-stamp write
  // then lands on its own schedule regardless of write order, because nothing about it checks
  // whether the quest is (about to be) paused. Result: the quest reads `paused`, but the work item
  // is left `in_progress` with a freshly-stamped `startedAt` — a "ghost running" row. The
  // elapsed-duration widget's `isRunning` reads ONLY the work item's own status
  // (`execution-row-layer-widget.tsx`), never the quest's, so this row keeps ticking a live
  // duration with nothing on screen to distinguish it from a legitimately running item.
  it("VALID: {an immediate second pause races the resumed dispatch's async re-stamp} => the pause guard misses the mid-transition item, leaving it in_progress with a fresh startedAt under a paused quest", async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'pause-resume-restamp-race' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Pause Resume Restamp Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const hydrated = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const workItem = hydrated.quest!.workItems[0]!;

    // Seed the exact instant a resume's synchronous status flip lands: quest back at
    // `in_progress`, the work item still the `pending` that a prior pause left it at — the async
    // re-dispatch pre-stamp has not run yet.
    const restored = await questModifyBroker({
      input: ModifyQuestInputStub({
        questId,
        status: 'in_progress',
        workItems: [{ id: workItem.id, status: 'pending' }] as never,
      }),
    });

    expect(restored.success).toBe(true);

    const freshStartedAt = new Date().toISOString();

    // Race the two calls that actually race in production: spawnBatchLayerBroker's pre-stamp
    // (element 0) and an immediate second questPauseBroker call (element 1). Both are direct
    // function calls, so their synchronous prefixes run in that order before either awaits —
    // the pre-stamp's lock-acquire fires before questPauseBroker's own snapshot read, giving the
    // snapshot read every opportunity to land on the still-`pending` state.
    const [, pauseResult] = await Promise.all([
      questModifyBroker({
        input: ModifyQuestInputStub({
          questId,
          workItems: [
            { id: workItem.id, status: 'in_progress', startedAt: freshStartedAt },
          ] as never,
        }),
      }),
      questPauseBroker({
        questId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls: buildNoopProcessControls(),
      }),
    ]);

    const final = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const finalWorkItem = final.quest!.workItems.find((item) => item.id === workItem.id)!;

    restore();
    testbed.cleanup();

    expect(pauseResult).toStrictEqual({ paused: true });
    expect(final.quest!.status).toBe('paused');
    // THE INVARIANT: pause catches EVERY active work item, so a work item mid-transition into
    // in_progress must not survive a pause that reports success. It does here.
    expect({ status: finalWorkItem.status, startedAt: finalWorkItem.startedAt }).toStrictEqual({
      status: 'pending',
      startedAt: undefined,
    });
  });
});
