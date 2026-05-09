/**
 * PURPOSE: Hand-crafted minimal-but-valid quest blueprint literal that satisfies every gate along the hydrator's walk to in_progress and drives stepsToWorkItemsTransformer to produce a full work-item chain (codeweaver + siegemaster + lawbringer + blightwarden) for orchestration smoketests
 *
 * USAGE:
 * const blueprint = questBlueprintContract.parse(smoketestBlueprintsStatics.minimal);
 * // Returns: validated QuestBlueprint; pass to questHydrateBroker to persist a quest at in_progress
 *
 * WHEN-TO-USE: Every orchestration smoketest scenario hydrates this blueprint, then optionally overrides `fixedQuestId`, `rolePromptOverrides`, or `skipRoles` per scenario.
 * WHEN-NOT-TO-USE: MCP and Signals suites that only spawn a single agent — they do not need a quest at all.
 *
 * NOTE: The object is a plain literal (not `as const`) so consumers like `QuestBlueprintStub` —
 * which expects mutable `StubArgument<QuestBlueprint>` — can accept it without readonly conflicts.
 * statics/ cannot import the zod contract, so `quest-hydrate-broker.integration.test.ts` is the
 * place that parses this literal through `questBlueprintContract` (via `QuestBlueprintStub`) and
 * will fail if any gate requirement drifts.
 */

const FIXED_TIMESTAMP = '2026-04-21T00:00:00.000Z';

export const smoketestBlueprintsStatics = {
  minimal: {
    title: 'Smoketest Orchestration Quest',
    userRequest:
      'Drive every orchestration role once through the work-item loop with canned prompt overrides',
    designDecisions: [
      {
        id: 'smoketest-design-decision',
        title: 'Smoketest uses minimal hand-crafted quest',
        rationale:
          'Avoids PathSeeker and ChaosWhisperer so scenarios can target the orchestration loop deterministically',
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
    planningNotes: {
      scopeClassification: {
        size: 'small',
        slicing: 'Single operational flow with one terminal observable',
        rationale:
          'Smoketest flow is intentionally trivial so orchestration behavior is the only variable',
        classifiedAt: FIXED_TIMESTAMP,
      },
      surfaceReports: [
        {
          id: '00000000-0000-0000-0000-00000000beef',
          sliceName: 'smoketest-slice',
          packages: ['@dungeonmaster/orchestrator'],
          flowIds: ['smoketest-signal-flow'],
          observableIds: ['smoketest-signal-received'],
          rawReport:
            '# Smoketest surface report\nMinimal single-slice report authored by the smoketest blueprint; no real research performed.',
          submittedAt: FIXED_TIMESTAMP,
        },
      ],
      synthesis: {
        orderOfOperations:
          'Orchestrator dispatches the scripted agent. Agent emits canned signal. Loop records result.',
        crossSliceResolutions:
          'No cross-slice concerns — a single agent runs per work-item within a single orchestration pass.',
        claudemdRulesInEffect: [],
        openAssumptions: [],
        synthesizedAt: FIXED_TIMESTAMP,
      },
      walkFindings: {
        filesRead: [],
        structuralIssuesFound: [],
        planPatches: [],
        verifiedAt: FIXED_TIMESTAMP,
      },
      reviewReport: {
        signal: 'clean',
        criticalItems: [],
        warnings: [],
        info: [],
        rawReport:
          '# Smoketest plan review\nSmoketest blueprint bypasses real plan review; emitted as clean so the seek_plan → in_progress gate opens.',
        reviewedAt: FIXED_TIMESTAMP,
      },
      blightReports: [],
    },
    steps: [
      {
        id: 'smoketest-emit-signal-step',
        slice: 'smoketest',
        name: 'Smoketest emit-signal step',
        assertions: [
          {
            prefix: 'VALID',
            input: '{orchestrator dispatches scripted agent}',
            expected: 'Agent emits scripted signal-back signal exactly once',
          },
        ],
        observablesSatisfied: ['smoketest-signal-received'],
        dependsOn: [],
        focusFile: {
          path: 'packages/orchestrator/src/statics/smoketest-blueprints/smoketest-blueprints-statics.ts',
        },
        accompanyingFiles: [],
        exportName: 'smoketestBlueprintsStatics',
        inputContracts: ['Void'],
        outputContracts: ['SmoketestPlaceholder'],
        uses: [],
      },
    ],
    skipRoles: ['ward'],
  },
};
