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

    // The forced-complete intake plan item, the Chaos-authored codeweaver item (advance marked it
    // in_progress), then the fixed verify tail as pending operation items — ward is skipped via the
    // blueprint's skipRoles. The relay creates ONE work item for the first actionable (codeweaver)
    // operation item; the verify tail lives only on the ledger until the relay reaches it.
    expect({
      success: loaded.success,
      status: loaded.quest?.status,
      operationRoles: operations.map((op) => op.role),
      operationStatuses: operations.map((op) => op.status),
      workItemRoles: workItems.map((wi) => wi.role),
      workItemStatuses: workItems.map((wi) => wi.status),
    }).toStrictEqual({
      success: true,
      status: 'in_progress',
      operationRoles: [
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'siegemaster',
        'lawbringer',
        'blightwarden',
      ],
      operationStatuses: ['complete', 'in_progress', 'pending', 'pending', 'pending', 'pending'],
      workItemRoles: ['codeweaver'],
      workItemStatuses: ['pending'],
    });
  });

  it('VALID: {smoketestBlueprintsStatics.minimal} => seeds the verify tail as locked operation items and no minion/ward work items (roles summon minions as sub-agents)', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-verify-tail' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Verify Tail Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);

    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const { operations, workItems } = loaded.quest!;

    // The verify tail is seeded as LOCKED operation items (the intake plan item is also locked, so
    // filter it out by role). Ward is skipped for the minimal blueprint. No minion/ward WORK items
    // exist — blightwarden/codeweaver/lawbringer summon their minions as sub-agents, not work items.
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
      lockedTailRoles: ['flowrider', 'siegemaster', 'lawbringer', 'blightwarden'],
      minionItems: [],
      wardOpCount: 0,
      workItemRoles: ['codeweaver'],
    });
  });
});
