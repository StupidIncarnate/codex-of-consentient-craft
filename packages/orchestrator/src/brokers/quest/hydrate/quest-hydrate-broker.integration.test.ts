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

  it('VALID: {smoketestBlueprintsStatics.minimal} => hydrates to in_progress with work items for every orchestration role', async () => {
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
    const rolesPresent = new Set(loaded.quest?.workItems.map((wi) => wi.role));
    const pathseekerItem = loaded.quest?.workItems.find((wi) => wi.role === 'pathseeker');

    restore();
    testbed.cleanup();

    expect({
      success: loaded.success,
      status: loaded.quest?.status,
      hasPathseeker: rolesPresent.has('pathseeker'),
      pathseekerStatus: pathseekerItem?.status,
      hasCodeweaver: rolesPresent.has('codeweaver'),
      hasSiegemaster: rolesPresent.has('siegemaster'),
      hasLawbringer: rolesPresent.has('lawbringer'),
      hasBlightwarden: rolesPresent.has('blightwarden'),
      hasWard: rolesPresent.has('ward'),
    }).toStrictEqual({
      success: true,
      status: 'in_progress',
      hasPathseeker: true,
      pathseekerStatus: 'complete',
      hasCodeweaver: true,
      hasSiegemaster: true,
      hasLawbringer: true,
      hasBlightwarden: true,
      hasWard: false,
    });
  });

  it('VALID: {smoketestBlueprintsStatics.minimal} => generates a single blightwarden depending on the lawbringers (no minion work items — blightwarden summons them itself)', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'hydrate-blightwarden-minions' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Blightwarden Minion Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub(smoketestBlueprintsStatics.minimal);

    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });
    const { workItems } = loaded.quest!;

    // Chain order is deterministic: lawbringers, then a SINGLE blightwarden depending on the full
    // lawbringer set. Blightwarden summons its five minions itself as sub-agents — they are NOT
    // work items. (The minimal smoketest blueprint generates no ward items — final-ward wiring is
    // covered by the steps-to-work-items-transformer unit tests.)
    const lawbringerIds = workItems.filter((wi) => wi.role === 'lawbringer').map((wi) => wi.id);
    const minionItems = workItems.filter((wi) => wi.role.endsWith('-minion'));
    const blightwarden = workItems.find((wi) => wi.role === 'blightwarden');

    restore();
    testbed.cleanup();

    // No minion work items — blightwarden is a single item that summons its minions as sub-agents.
    expect(minionItems).toStrictEqual([]);
    // The single blightwarden depends on the full lawbringer set.
    expect(blightwarden?.dependsOn).toStrictEqual(lawbringerIds);
  });
});
