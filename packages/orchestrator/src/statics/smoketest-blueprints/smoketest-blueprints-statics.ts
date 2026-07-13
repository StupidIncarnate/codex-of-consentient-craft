/**
 * PURPOSE: Hand-crafted minimal-but-valid quest blueprint literal that satisfies every gate along
 * the hydrator's walk to in_progress — including the `approved` gate's ">=1 codeweaver operation
 * item" requirement — so the relay seeds a codeweaver -> verify-tail work-item chain for
 * orchestration smoketests.
 *
 * USAGE:
 * const blueprint = questBlueprintContract.parse(smoketestBlueprintsStatics.minimal);
 * // Returns: validated QuestBlueprint; pass to questHydrateBroker to persist a quest at in_progress
 *
 * WHEN-TO-USE: Every orchestration smoketest scenario hydrates this blueprint, then optionally
 * overrides `fixedQuestId`, `rolePromptOverrides`, or `skipRoles` per scenario.
 * WHEN-NOT-TO-USE: MCP and Signals suites that only spawn a single agent — they do not need a quest at all.
 *
 * NOTE: The object is a plain literal (not `as const`) so consumers like `QuestBlueprintStub` —
 * which expects mutable `StubArgument<QuestBlueprint>` — can accept it without readonly conflicts.
 * statics/ cannot import the zod contract, so `quest-hydrate-broker.integration.test.ts` is the
 * place that parses this literal through `questBlueprintContract` (via `QuestBlueprintStub`) and
 * will fail if any gate requirement drifts. The `operations` array stands in for the codeweaver
 * implementation items ChaosWhisperer authors during explore_observables; the hydrator appends the
 * fixed verify tail (flowrider, siegemaster, lawbringer, blightwarden — ward is skipped here) at
 * in_progress.
 */

export const smoketestBlueprintsStatics = {
  minimal: {
    title: 'Smoketest Orchestration Quest',
    userRequest:
      'Drive every orchestration role once through the operations relay with canned prompt overrides',
    designDecisions: [
      {
        id: 'smoketest-design-decision',
        title: 'Smoketest uses a hand-crafted spec + operations ledger',
        rationale:
          'Hand-crafts the spec and one codeweaver operation item so scenarios drive the orchestration relay deterministically instead of running a real ChaosWhisperer session',
        relatedNodeIds: [],
      },
    ],
    contracts: [
      {
        id: 'smoketest-placeholder',
        name: 'SmoketestPlaceholder',
        kind: 'data',
        status: 'new',
        source:
          'packages/orchestrator/src/contracts/smoketest-placeholder/smoketest-placeholder-contract.ts',
        nodeId: 'emit-signal',
        properties: [
          {
            name: 'value',
            type: 'SmoketestPlaceholder',
            description:
              'Placeholder branded non-empty string used only to satisfy contract requirements',
          },
        ],
      },
    ],
    toolingRequirements: [],
    flows: [
      {
        id: 'smoketest-signal-flow',
        name: 'Smoketest Signal Flow',
        flowType: 'operational',
        entryPoint: 'orchestrator dispatches smoketest agent',
        exitPoints: ['agent signaled complete'],
        nodes: [
          {
            id: 'dispatch-agent',
            label: 'Orchestrator dispatches agent with override prompt',
            type: 'action',
            observables: [],
          },
          {
            id: 'emit-signal',
            label: 'Agent emits signal-back',
            type: 'terminal',
            observables: [
              {
                id: 'smoketest-signal-received',
                type: 'log-output',
                description:
                  'Agent stream includes exactly one mcp__dungeonmaster__signal-back tool-use with the scripted signal',
              },
            ],
          },
        ],
        edges: [
          {
            id: 'dispatch-to-signal',
            from: 'dispatch-agent',
            to: 'emit-signal',
          },
        ],
      },
    ],
    operations: [
      {
        id: '00000000-0000-4000-8000-00000000c0de',
        role: 'codeweaver',
        text: 'Smoketest: implement the single-flow signal emitter',
        status: 'pending',
        locked: false,
      },
    ],
    skipRoles: ['ward'],
  },
};
