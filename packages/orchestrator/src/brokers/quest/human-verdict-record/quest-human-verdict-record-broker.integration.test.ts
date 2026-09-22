import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GetQuestInputStub,
  GuildNameStub,
  GuildPathStub,
} from '@dungeonmaster/shared/contracts';

import { QuestBlueprintStub } from '../../../contracts/quest-blueprint/quest-blueprint.stub';
import { smoketestBlueprintsStatics } from '../../../statics/smoketest-blueprints/smoketest-blueprints-statics';
import { orchestrationEnvironmentHarness } from '../../../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { guildAddBroker } from '../../guild/add/guild-add-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questHydrateBroker } from '../hydrate/quest-hydrate-broker';
import { questHumanVerdictRecordBroker } from './quest-human-verdict-record-broker';

// `at` is stamped SERVER-SIDE off the real clock, so on real disk it cannot be written down ahead
// of time. Both sides of the `at` comparison are re-stamped with one sentinel — the stamp's own
// behaviour is proven at the unit level (quest-human-verdict-record-broker.test.ts), against a
// frozen clock.
const NORMALIZED_STAMP = '1970-01-01T00:00:00.000Z';

// Mirrors `smoketestBlueprintsStatics.minimal.flows[0]` node-for-node (same ids, so the blueprint's
// contract `nodeId: 'emit-signal'` and operations item still resolve exactly as the plain blueprint
// already proves they do) and adds ONE extra observable flagged verifyByHuman.
const flowWithHumanCheckObservable = FlowStub({
  id: 'smoketest-signal-flow',
  name: 'Smoketest Signal Flow',
  flowType: 'runtime',
  entryPoint: 'orchestrator dispatches smoketest agent',
  exitPoints: ['agent signaled complete'],
  nodes: [
    FlowNodeStub({
      id: 'dispatch-agent',
      label: 'Orchestrator dispatches agent with override prompt',
      type: 'action',
      packages: ['orchestrator'],
      observables: [],
    }),
    FlowNodeStub({
      id: 'emit-signal',
      label: 'Agent emits signal-back',
      type: 'terminal',
      packages: ['orchestrator'],
      observables: [
        FlowObservableStub({
          id: 'smoketest-signal-received',
          type: 'log-output',
          package: 'orchestrator',
          description:
            'Agent stream includes exactly one mcp__dungeonmaster__signal-back tool-use with the scripted signal',
        }),
        FlowObservableStub({
          id: 'motion-feels-smooth',
          type: 'ui-state',
          package: 'orchestrator',
          description: 'the transition feels smooth',
          verifyByHuman: true,
        }),
      ],
    }),
  ],
  edges: [FlowEdgeStub({ id: 'dispatch-to-signal', from: 'dispatch-agent', to: 'emit-signal' })],
});

describe('questHumanVerdictRecordBroker (integration — real disk)', () => {
  const envHarness = orchestrationEnvironmentHarness();

  it('VALID: {a real testbed quest carrying a verifyByHuman observable} => the verdict round-trips through questGetBroker as a human-verdict note', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'human-verdict-round-trip' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    await envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Human Verdict Round Trip Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      flows: [flowWithHumanCheckObservable],
    });
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    await questHumanVerdictRecordBroker({
      questId,
      unitId: 'motion-feels-smooth',
      outcome: 'met',
      reason: 'Watched run_7/walk.webm end to end — the transition never stutters.',
    });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    const persistedNotes = loaded.quest!.planningNotes.questNotes.map((note) => ({
      ...note,
      at: NORMALIZED_STAMP,
    }));

    expect(persistedNotes).toStrictEqual([
      {
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '00000000-0000-0000-0000-000000000000',
        flowId: 'smoketest-signal-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        summary: 'the transition feels smooth: confirmed',
        detail: 'Watched run_7/walk.webm end to end — the transition never stutters.',
        at: NORMALIZED_STAMP,
      },
    ]);
  });

  it('VALID: {a second verdict on the same unit, on real disk} => REPLACES the first note rather than appending a second', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: BaseNameStub({ value: 'human-verdict-second-verdict-replaces' }),
    });
    const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
    await envHarness.seedQuestRepoPackages({
      repoRoot: testbed.guildPath,
      locations: smoketestBlueprintsStatics.minimal.packagesAffected.map((entry) => entry.location),
      sources: smoketestBlueprintsStatics.minimal.contracts.map((entry) => entry.source),
    });

    const guild = await guildAddBroker({
      name: GuildNameStub({ value: 'Human Verdict Replace Guild' }),
      path: GuildPathStub({ value: testbed.guildPath }),
    });
    const blueprint = QuestBlueprintStub({
      ...smoketestBlueprintsStatics.minimal,
      flows: [flowWithHumanCheckObservable],
    });
    const { questId } = await questHydrateBroker({ blueprint, guildId: guild.id });

    await questHumanVerdictRecordBroker({
      questId,
      unitId: 'motion-feels-smooth',
      outcome: 'not-met',
      reason: 'First look — seemed janky.',
    });
    await questHumanVerdictRecordBroker({
      questId,
      unitId: 'motion-feels-smooth',
      outcome: 'met',
      reason: 'Second look — motion is smooth now.',
    });

    const loaded = await questGetBroker({ input: GetQuestInputStub({ questId }) });

    restore();
    testbed.cleanup();

    const persistedNotes = loaded.quest!.planningNotes.questNotes.map((note) => ({
      ...note,
      at: NORMALIZED_STAMP,
    }));

    expect(persistedNotes).toStrictEqual([
      {
        id: 'human-verdict-motion-feels-smooth',
        kind: 'human-verdict',
        role: 'operator',
        workItemId: '00000000-0000-0000-0000-000000000000',
        flowId: 'smoketest-signal-flow',
        unitId: 'motion-feels-smooth',
        outcome: 'met',
        summary: 'the transition feels smooth: confirmed',
        detail: 'Second look — motion is smooth now.',
        at: NORMALIZED_STAMP,
      },
    ]);
  });
});
