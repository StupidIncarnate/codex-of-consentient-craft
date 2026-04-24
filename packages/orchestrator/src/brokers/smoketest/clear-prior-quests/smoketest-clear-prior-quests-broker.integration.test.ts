import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { GetQuestInputStub } from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { questGetBroker } from '../../quest/get/quest-get-broker';
import { questHydrateBroker } from '../../quest/hydrate/quest-hydrate-broker';
import { smoketestEnsureGuildBroker } from '../ensure-guild/smoketest-ensure-guild-broker';
import { smoketestClearPriorQuestsBroker } from './smoketest-clear-prior-quests-broker';

describe('smoketestClearPriorQuestsBroker', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {multiple quests, one matches questSource} => deletes only the matching quest and returns deletedCount 1', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'clear-prior-quests-mcp' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const { guildId } = await smoketestEnsureGuildBroker();

    const mcpBlueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      title: 'Prior MCP smoketest quest',
    });
    const signalsBlueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      title: 'Prior Signals smoketest quest',
    });

    const mcpHydrated = await questHydrateBroker({
      blueprint: mcpBlueprint,
      guildId,
      questSource: 'smoketest-mcp',
    });
    const signalsHydrated = await questHydrateBroker({
      blueprint: signalsBlueprint,
      guildId,
      questSource: 'smoketest-signals',
    });

    const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

    const mcpLoaded = await questGetBroker({
      input: GetQuestInputStub({ questId: mcpHydrated.questId }),
    });
    const signalsLoaded = await questGetBroker({
      input: GetQuestInputStub({ questId: signalsHydrated.questId }),
    });

    restore();
    testbed.cleanup();

    expect({
      deletedCount: result.deletedCount,
      mcpRemoved: !mcpLoaded.success,
      signalsSurvived: signalsLoaded.success,
      signalsQuestSource: signalsLoaded.quest?.questSource,
    }).toStrictEqual({
      deletedCount: 1,
      mcpRemoved: true,
      signalsSurvived: true,
      signalsQuestSource: 'smoketest-signals',
    });
  });

  it('VALID: {no matching quests} => returns deletedCount 0 without side effects', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'clear-prior-quests-empty' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const { guildId } = await smoketestEnsureGuildBroker();

    const userBlueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      title: 'User-like smoketest quest',
    });
    const userHydrated = await questHydrateBroker({
      blueprint: userBlueprint,
      guildId,
    });

    const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

    const userLoaded = await questGetBroker({
      input: GetQuestInputStub({ questId: userHydrated.questId }),
    });

    restore();
    testbed.cleanup();

    expect({
      deletedCount: result.deletedCount,
      userQuestStillExists: userLoaded.success,
    }).toStrictEqual({
      deletedCount: 0,
      userQuestStillExists: true,
    });
  });

  it('VALID: {two matching quests for smoketest-mcp} => deletes both and returns deletedCount 2', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'clear-prior-quests-two-mcp' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

    const { guildId } = await smoketestEnsureGuildBroker();

    const firstBlueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      title: 'MCP smoketest quest A',
    });
    const secondBlueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      title: 'MCP smoketest quest B',
    });

    const firstHydrated = await questHydrateBroker({
      blueprint: firstBlueprint,
      guildId,
      questSource: 'smoketest-mcp',
    });
    const secondHydrated = await questHydrateBroker({
      blueprint: secondBlueprint,
      guildId,
      questSource: 'smoketest-mcp',
    });

    const result = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });

    const firstLoaded = await questGetBroker({
      input: GetQuestInputStub({ questId: firstHydrated.questId }),
    });
    const secondLoaded = await questGetBroker({
      input: GetQuestInputStub({ questId: secondHydrated.questId }),
    });

    restore();
    testbed.cleanup();

    expect({
      deletedCount: result.deletedCount,
      firstRemoved: !firstLoaded.success,
      secondRemoved: !secondLoaded.success,
    }).toStrictEqual({
      deletedCount: 2,
      firstRemoved: true,
      secondRemoved: true,
    });
  });
});
