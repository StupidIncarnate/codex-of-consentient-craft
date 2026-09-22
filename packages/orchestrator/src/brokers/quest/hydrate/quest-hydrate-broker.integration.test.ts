import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { GetQuestInputStub, GuildNameStub, GuildPathStub } from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questHydrateBroker } from './quest-hydrate-broker';

describe('questHydrateBroker', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {targetStatus: explore_flows} => quest walks from created to explore_flows', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-explore-flows' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Hydrate Test Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub({ targetStatus: 'explore_flows' });

    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect({
      success: loaded.success,
      status: loaded.quest?.status,
      title: loaded.quest?.title,
      userRequest: loaded.quest?.userRequest,
    }).toStrictEqual({
      success: true,
      status: 'explore_flows',
      title: blueprint.title,
      userRequest: blueprint.userRequest,
    });
  });

  it('VALID: {questSource: "smoketest-orchestration"} => persists questSource onto the hydrated quest', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-quest-source' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Quest Source Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub({ targetStatus: 'explore_flows' });

    const { questId } = await questHydrateBroker({
      blueprint,
      guildId: guild.id,
      questSource: 'smoketest-orchestration',
    });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect(loaded.quest?.questSource).toBe('smoketest-orchestration');
  });

  it('VALID: {no questSource} => hydrated quest has questSource undefined', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-no-quest-source' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'No Quest Source Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub({ targetStatus: 'explore_flows' });

    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    expect(loaded.quest?.questSource).toBe(undefined);
  });

  it('VALID: {smoketestBlueprintsStatics.minimal} => hydrates to in_progress, seeding the operations relay tail and ONE codeweaver work item', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-minimal-in-progress' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    await envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Smoketest Minimal Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);

    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const { operations, workItems } = loaded.quest!;

    restore();
    testbed.cleanup();

    // The blueprint's codeweaver scope (advance marked it in_progress) leads, reordered
    // dependencies-first ahead of the forced-complete intake item. Nothing else is on the ledger:
    // scopes are minted when the family graph routes to a family, and the ENTRY family's own scope
    // is dropped by hydrate — a hydrated quest is fabricated directly at `in_progress` and has no
    // workspace to carve. The relay creates ONE work item, for the first actionable scope, stamped
    // with ITS OWN family's entry step — `agentFlowStatics.codeweaver.entry` is `plan`, never
    // riftcarver's `carve`, which the codeweaver family does not declare as a step at all.
    expect({
      success: loaded.success,
      status: loaded.quest?.status,
      operationRoles: operations.map((op) => op.role),
      operationStatuses: operations.map((op) => op.status),
      workItemRoles: workItems.map((wi) => wi.role),
      workItemStatuses: workItems.map((wi) => wi.status),
      workItemSteps: workItems.map((wi) => wi.step),
    }).toStrictEqual({
      success: true,
      status: 'in_progress',
      operationRoles: ['codeweaver', 'chaoswhisperer'],
      operationStatuses: ['in_progress', 'complete'],
      workItemRoles: ['codeweaver'],
      workItemStatuses: ['pending'],
      workItemSteps: ['plan'],
    });
  });

  it('VALID: {smoketestBlueprintsStatics.minimal} => seeds NO later-family scopes and no minion/ward work items (roles summon minions as sub-agents)', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-verify-tail' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    await envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Verify Tail Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);

    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const { operations, workItems } = loaded.quest!;

    // No LOCKED scope but the intake plan item exists: flowrider and siegemaster are minted when the
    // family graph routes to them, and the entry family's own scope is dropped by hydrate. No
    // minion/ward WORK items exist either — the operator families summon their minions as
    // sub-agents, never as work items.
    const lockedTailRoles = operations
      .filter((op) => op.locked)
      .filter((op) => op.role !== 'chaoswhisperer')
      .map((op) => op.role);
    const minionItems = workItems.filter((wi) => wi.role.endsWith('-minion'));
    const wardOpCount = operations.filter((op) => op.role === 'ward').length;

    restore();
    testbed.cleanup();

    expect({
      lockedTailRoles,
      minionItems,
      wardOpCount,
      workItemRoles: workItems.map((wi) => wi.role),
    }).toStrictEqual({
      lockedTailRoles: [],
      minionItems: [],
      wardOpCount: 0,
      workItemRoles: ['codeweaver'],
    });
  });
});
