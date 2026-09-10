import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  GetQuestInputStub,
  GuildNameStub,
  GuildPathStub,
  QuestStatusStub,
} from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questHydrateBroker } from '../hydrate/quest-hydrate-broker';
import { questPauseBroker } from '../pause/quest-pause-broker';
import { preStampInProgressLayerBroker } from './pre-stamp-in-progress-layer-broker';

// No subprocess ever registers for the racing pause call in this suite, so a no-op pair is the
// honest stand-in for the real `orchestrationProcessesState` methods questPauseBroker takes as a
// parameter (brokers cannot import state/ — see that broker's own header).
const buildNoopProcessControls = (): {
  findAllByQuestId: () => never[];
  kill: () => undefined;
} => ({
  findAllByQuestId: () => [],
  kill: () => undefined,
});

// GAP this test closes (live-elapsed-duration-on-in-progress-work-items): quest-pause-broker.ts
// was rewritten this pass to decide "which work items are active" and persist that reset inside
// ONE questWithModifyLockBroker turn, closing the direction where a pre-stamp's write landed
// BETWEEN pause's decision and its persist. That fix's own header names the direction it leaves
// open: "if a pause's write lands *before* a resume's pre-stamp ... the pre-stamp in
// spawn-batch-layer-broker.ts still re-stamps unconditionally since it never checks quest status."
//
// This test drives exactly that reverse order, deterministically: both racers are direct function
// calls, so their synchronous prefixes run in Promise.all's left-to-right evaluation order before
// either awaits, and questWithModifyLockBroker's per-questId chain registers synchronously inside
// that prefix (see quest-with-modify-lock-broker.ts — the map `.set()` happens before the first
// `await` in either caller). Putting questPauseBroker FIRST in the array guarantees its call
// registers into the per-quest lock queue ahead of the pre-stamp, so pause's read-decide-persist
// turn runs to completion before the pre-stamp's own fresh read ever happens.
describe('preStampInProgressLayerBroker (integration — real disk, real concurrency)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it("VALID: {a pause's write lands before an in-flight dispatch's pre-stamp} => the pre-stamp is refused and the work item is never re-armed under a paused quest", async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'pre-stamp-pause-race' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Pre-Stamp Pause Race Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    // Hydrate leaves the quest at `in_progress` with its first (and only) work item `pending` —
    // exactly the instant a dispatch already decided to spawn, before its own async pre-stamp
    // lands, matches in production.
    const hydrated = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const workItem = hydrated.quest!.workItems[0]!;

    const [pauseResult, stampResult] = await Promise.all([
      questPauseBroker({
        questId,
        previousStatus: QuestStatusStub({ value: 'in_progress' }),
        processControls: buildNoopProcessControls(),
      }),
      preStampInProgressLayerBroker({ questId, workItemId: workItem.id }),
    ]);

    const final = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const finalWorkItem = final.quest!.workItems.find((item) => item.id === workItem.id)!;

    restore();
    testbed.cleanup();

    expect(pauseResult).toStrictEqual({ paused: true });
    expect(stampResult).toStrictEqual({ stamped: false });
    expect(final.quest!.status).toBe('paused');
    // THE INVARIANT: a dispatch already in flight when the user pauses must not re-arm a work
    // item pause already reset — it stays pending, with no fresh startedAt, under a paused quest.
    expect({ status: finalWorkItem.status, startedAt: finalWorkItem.startedAt }).toStrictEqual({
      status: 'pending',
      startedAt: undefined,
    });
  });
});
