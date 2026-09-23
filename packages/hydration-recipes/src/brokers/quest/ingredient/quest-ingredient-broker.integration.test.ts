import { fromSavedRefTransformer } from '@dungeonmaster/hydration/transformers';
import { SavedRecordNameStub, FieldNameStub } from '@dungeonmaster/hydration/contracts';
import { GuildIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { dmRegistryBroker } from '../../dm/registry/dm-registry-broker';
import { recipesHydrationCreateBroker } from '../../recipes-hydration/create/recipes-hydration-create-broker';
import { QuestFieldsStub } from '../../../contracts/quest-fields/quest-fields.stub';
import { fileTargetHarness } from '../../../../test/harnesses/file-target/file-target.harness';

const { recipe } = recipesHydrationCreateBroker();
const RENAMED_TITLE = QuestFieldsStub({ title: 'Renamed through the update route' }).title;
const CROSS_PLAN_WORK_ITEM_CREATED_AT = '2024-01-01T00:00:00.000Z';
const NEW_OPERATION_SAVED_NAME = SavedRecordNameStub({ value: 'newOperation' });
const OPERATION_ID_FIELD = FieldNameStub({ value: 'id' });

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

// Proves the cross-plan gap `packages/hydration/CLAUDE.md`'s "A later op reads an earlier row's
// id through `fromSaved`" section and `packages/hydration-recipes/CLAUDE.md`'s `attachWorkItem`
// section both named as still open: a plan's own `state.saved` is scoped to ONE `run()` call, so a
// SECOND, separate plan cannot reach a row the FIRST one created by name — only by a query the row's
// own ingredient supports. `attach` is that query. Two full `dmRegistryBroker.run()` calls, never
// one plan split in two: the first's own `state.saved` is gone by the time the second begins, which
// is the exact gap being proven closed.
describe('quest ingredient — attach reaches a row an EARLIER, SEPARATE run() created (integration — real disk)', () => {
  const fileTarget = fileTargetHarness();

  it('VALID: {plan 1 creates a guild+quest; plan 2, a separate run(), attaches that quest by id and links a new work item to a new operation on it} => the on-disk quest carries both', async () => {
    const seedRecipe = recipe(
      {
        name: 'cross-plan-attach-seed',
        description: 'one guild holding one quest, for a later, separate plan to attach',
      },
      () => [
        dmRegistryBroker.guilds.add(1, (g) => [
          g[0].quests.add(1, (q) => [q[0].saveRecordAs({ name: 'quest' })]),
          g[0].saveRecordAs({ name: 'guild' }),
        ]),
      ],
    );

    const seeded = (await dmRegistryBroker.run(seedRecipe(), fileTarget.target())) as Record<
      PropertyKey,
      unknown
    >;
    const seededGuild = seeded.guild as Record<PropertyKey, unknown>;
    const seededQuest = seeded.quest as Record<PropertyKey, unknown>;
    const seededQuestId = QuestIdStub({ value: String(seededQuest.id) });
    const seededGuildId = GuildIdStub({ value: String(seededGuild.id) });

    // A SEPARATE recipe, run through a SEPARATE `dmRegistryBroker.run()` call — plan 1's own
    // `state.saved` (`seeded.quest`/`seeded.guild`) is already gone; only the real ids extracted
    // above cross the boundary. `operations` is minted through its OWN top-level `.under()`, not
    // through `attach(...).operations.add(...)`: the attached quest has no live GUILD ancestor in
    // THIS run for the operation's second link to read (see this file's own `attach` section in
    // `packages/hydration/CLAUDE.md`), so `.under({questId, guildId})` supplies both foreign keys
    // directly instead, exactly as it already does for `quest-advances-one-step`.
    const attachRecipe = recipe(
      {
        name: 'cross-plan-attach-link',
        description:
          'attaches an existing quest by id and links a new work item to a new operation on it',
      },
      () => [
        dmRegistryBroker.operations
          .under({ questId: seededQuestId, guildId: seededGuildId })
          .add(1, (ops) => [ops[0].saveRecordAs({ name: NEW_OPERATION_SAVED_NAME })]),
        dmRegistryBroker.quests.attach({ id: seededQuestId, guildId: seededGuildId }, (q) => [
          q.attachWorkItem({
            role: 'codeweaver',
            status: 'complete',
            spawnerType: 'agent',
            createdAt: CROSS_PLAN_WORK_ITEM_CREATED_AT,
            operationId: fromSavedRefTransformer({
              name: NEW_OPERATION_SAVED_NAME,
              field: OPERATION_ID_FIELD,
            }),
          }),
        ]),
      ],
    );

    await dmRegistryBroker.run(attachRecipe(), fileTarget.target());

    const onDisk = fileTarget.readQuestByTitle({
      title: QuestFieldsStub({ title: String(seededQuest.title) }).title,
    });
    const mintedOperationIds = onDisk.operations.map((operation) => operation.id);
    const workItemsWithAnyId = onDisk.workItems.map((workItem) => ({ ...workItem, id: 'any' }));

    expect({
      operationsCount: onDisk.operations.length,
      workItems: workItemsWithAnyId,
    }).toStrictEqual({
      operationsCount: 1,
      workItems: [
        {
          id: 'any',
          role: 'codeweaver',
          status: 'complete',
          spawnerType: 'agent',
          createdAt: CROSS_PLAN_WORK_ITEM_CREATED_AT,
          relatedDataItems: mintedOperationIds.map((operationId) => `operations/${operationId}`),
          dependsOn: [],
          attempt: 0,
          maxAttempts: 1,
          retryCount: 0,
          observations: [],
          assignedUnitIds: [],
        },
      ],
    });
  });
});
