/**
 * PURPOSE: Hand-crafted minimal-but-valid quest blueprint literal that satisfies every gate along
 * the hydrator's walk to in_progress, and pins the implementation ledger to ONE codeweaver item so
 * the orchestration scenarios' per-role scripts stay one-signal-deep.
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
 * will fail if any gate requirement drifts. The `operations` array is NOT walked through
 * modify-quest — the ledger is off that allowlist at every status — it is written by
 * `questHydrateBroker`'s direct persist, where an authored implementation item REPLACES the item
 * the flows would otherwise derive for the same role; the hydrator appends the
 * fixed verify tail (flowrider, siegemaster — ward is skipped here) at in_progress. Groundstomper
 * is also part of the tail but fans to zero items, because the quest's only package
 * (`orchestrator`) is not e2e-eligible. There is no standards-review item anywhere in the tail: the
 * five concerns are reviewed by a reviewer-minion inside each committing session's own turn.
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
        // `existing`, because the file at `source` below is committed in this repo — the repo
        // every smoketest quest targets, since `smoketestEnsureGuildBroker` resolves the guild
        // whose path walks up to the same repo root as the dungeonmaster home. `questModifyBroker`'s
        // `Contract Source Resolution` check anchors the path on that project root, so a blueprint
        // declaring `new` over a committed file is a status-vs-disk mismatch and the hydrator is
        // refused at the `explore_observables` step. An integration test hydrating this blueprint
        // into a testbed repo must therefore seed the file too — `seedQuestRepoPackages({ sources })`
        // does that, the same way it seeds each declared package location.
        status: 'existing',
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
    packagesAffected: [
      {
        name: 'orchestrator',
        location: './packages/orchestrator',
        changeType: 'edit',
        packageType: 'programmatic-service',
      },
    ],
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
            packages: ['orchestrator'],
            observables: [],
          },
          {
            id: 'emit-signal',
            label: 'Agent emits signal-back',
            type: 'terminal',
            packages: ['orchestrator'],
            observables: [
              {
                id: 'smoketest-signal-received',
                type: 'log-output',
                package: 'orchestrator',
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
        packageNames: ['orchestrator'],
      },
    ],
    skipRoles: ['ward'],
  },
};
