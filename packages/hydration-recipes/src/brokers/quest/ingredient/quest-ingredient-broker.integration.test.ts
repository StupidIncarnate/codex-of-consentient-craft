import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';

const { recipe } = recipesHydrationCreateBroker();
const RENAMED_TITLE = QuestFieldsStub({ title: 'Renamed through the update route' }).title;

// Real disk, real `questModifyBroker`, real `questGetBroker` — no adapter or child broker is
// mocked. `quest-reach-route-broker.test.ts` beside this one proves the routing logic against a
// stubbed `questModifyBroker`/`questGetBroker`; it cannot prove the REAL gates (the transition
// guard, the gate-content guard) actually run, or that a walked row and a raw-written row land
// distinguishably on real disk. This suite is what those two claims rest on.
describe('quest ingredient — transitions.reach walks the real gates (integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('VALID: {q[0].set({status: "explore_flows"})} => the on-disk record carries the walked status, never the create-time default', async () => {
    const walkedQuestRecipe = recipe(
      {
        name: 'quest-status-walk-single-hop',
        description: 'one quest walked from created to explore_flows',
      },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].quests.add(1, (q) => [
            q[0].set({ status: 'explore_flows' }),
            q[0].saveRecordAs({ name: 'walked' }),
          ]),
        ]),
      ],
    );

    const result = (await dmRegistryBroker.run(walkedQuestRecipe(), fileTarget.target())) as Record<
      PropertyKey,
      unknown
    >;
    const walked = result.walked as Record<PropertyKey, unknown>;

    expect(walked.status).toBe('explore_flows');
  });

  it('VALID: {one quest walked with set(), a sibling written raw with setRaw()} => the two rows are distinguishable', async () => {
    const contrastRecipe = recipe(
      {
        name: 'quest-status-walked-vs-raw',
        description: 'two quests under one guild, one walked and one written raw',
      },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].quests.add(2, (q) => [
            q[0].set({ status: 'explore_flows' }),
            q[0].saveRecordAs({ name: 'walked' }),
            q[1].setRaw({ status: 'blocked' }),
            q[1].saveRecordAs({ name: 'raw' }),
          ]),
        ]),
      ],
    );

    const result = (await dmRegistryBroker.run(contrastRecipe(), fileTarget.target())) as Record<
      PropertyKey,
      unknown
    >;
    const walked = result.walked as Record<PropertyKey, unknown>;
    const raw = result.raw as Record<PropertyKey, unknown>;

    expect({ walkedStatus: walked.status, rawStatus: raw.status }).toStrictEqual({
      walkedStatus: 'explore_flows',
      rawStatus: 'blocked',
    });
  });

  it('VALID: {g[0].quests.filter({where: {status}}).set({title}) after a walk} => the update route returns the reloaded record, not a result envelope', async () => {
    const updateAfterWalkRecipe = recipe(
      {
        name: 'quest-status-walk-then-update',
        description: 'one quest walked to explore_flows, then renamed through a filtered update',
      },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].quests.add(1, (q) => [q[0].set({ status: 'explore_flows' })]),
          g[0].quests.filter({ where: { status: 'explore_flows' } }).set({ title: RENAMED_TITLE }),
          g[0].quests
            .filter({ where: { status: 'explore_flows' } })
            .saveRecordAs({ name: 'updated' }),
        ]),
      ],
    );

    const result = (await dmRegistryBroker.run(
      updateAfterWalkRecipe(),
      fileTarget.target(),
    )) as Record<PropertyKey, unknown>;
    const updated = result.updated as Record<PropertyKey, unknown>;

    expect({ title: updated.title, status: updated.status }).toStrictEqual({
      title: RENAMED_TITLE,
      status: 'explore_flows',
    });
  });

  it('ERROR: {q[0].set({status: "flows_approved"}) with no flows content} => the real gate refuses, naming the from, the to and what the gate said', async () => {
    const refusedWalkRecipe = recipe(
      {
        name: 'quest-status-walk-refused',
        description: 'one quest asked to walk straight to flows_approved with no flows content',
      },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].quests.add(1, (q) => [q[0].set({ status: 'flows_approved' })]),
        ]),
      ],
    );

    await expect(dmRegistryBroker.run(refusedWalkRecipe(), fileTarget.target())).rejects.toThrow(
      /^recipe "quest-status-walk-refused": ingredient "quest" cannot go to "flows_approved" from "created": questReachRouteBroker: could not reach "flows_approved" — Missing required content for transition to flows_approved$/u,
    );
  });
});
