import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  QuestNoteStub,
  QuestStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { signoffTracksStatics } from '@dungeonmaster/shared/statics';

import { questSummaryBuildTransformer } from './quest-summary-build-transformer';

// A two-node flow: `dashboard` is the only terminal (no outgoing edge) and `e-success` is the only
// labelled edge, so the graph contributes 1 terminal + 1 branch. Every flow also contributes the 7
// off-map probe families, which Siegemaster owns alone.
const LOGIN_NODES = [
  FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
  FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
];

const LOGIN_EDGES = [
  FlowEdgeStub({ id: 'e-success', from: 'login-page', to: 'dashboard', label: 'success' }),
];

// The same graph plus two spec observables, so each authoring denominator is 4 units
// (1 terminal + 1 branch + 2 observables) and siegemaster's is 11 (those 4 plus 7 off-map
// families). Every marked-unit test below counts against those two numbers.
const MARKED_FLOW = FlowStub({
  nodes: [
    FlowNodeStub({
      id: 'login-page',
      label: 'Login Page',
      type: 'state',
      observables: [
        FlowObservableStub({
          id: 'shows-form',
          type: 'ui-state',
          description: 'shows the login form',
        }),
        FlowObservableStub({
          id: 'rejects-empty-password',
          type: 'api-call',
          description: 'POST /api/auth/login returns 422 for an empty password',
        }),
      ],
    }),
    FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
  ],
  edges: LOGIN_EDGES,
});

const CODEWEAVER_ITEM_ID = '11111111-1111-4111-8111-111111111111';
const FLOWRIDER_ITEM_ID = '22222222-2222-4222-8222-222222222222';
const FLOWRIDER_SUCCESSOR_ITEM_ID = '33333333-3333-4333-8333-333333333333';
const SIEGEMASTER_ITEM_ID = '44444444-4444-4444-8444-444444444444';

// 7 flows carrying 19 terminals + 85 branches + 128 observables + 7x7 off-map families = 281 units.
// Flow 0 carries the surplus: 7 terminals, 13 branches, 20 observables; every other flow carries
// 2 terminals, 12 branches, 18 observables. Its first observable is a Siegemaster mid-walk
// addition, so it sits outside Flowrider's denominator entirely.
const SCALE_FLOW_COUNT = 7;

const SCALE_FLOWS = Array.from({ length: SCALE_FLOW_COUNT }, (_unusedFlow, flowIndex) => {
  const terminalCount = flowIndex === 0 ? 7 : 2;
  const branchCount = flowIndex === 0 ? 13 : 12;
  const observableCount = flowIndex === 0 ? 20 : 18;

  return FlowStub({
    id: `scale-flow-${flowIndex}`,
    name: `Scale Flow ${flowIndex}`,
    flowType: 'runtime',
    entryPoint: 'n-entry',
    exitPoints: ['/done'],
    nodes: [
      FlowNodeStub({
        id: 'n-entry',
        label: 'Entry',
        type: 'state',
        observables: Array.from({ length: observableCount }, (_unusedObservable, observableIndex) =>
          FlowObservableStub({
            id: `obs-${observableIndex}`,
            type: 'ui-state',
            description: `observable ${observableIndex} on flow ${flowIndex}`,
            addedBy: flowIndex === 0 && observableIndex === 0 ? 'siegemaster' : 'spec',
          }),
        ),
      }),
      ...Array.from({ length: terminalCount }, (_unusedTerminal, terminalIndex) =>
        FlowNodeStub({
          id: `n-term-${terminalIndex}`,
          label: `Terminal ${terminalIndex}`,
          type: 'terminal',
        }),
      ),
    ],
    edges: Array.from({ length: branchCount }, (_unusedBranch, branchIndex) =>
      FlowEdgeStub({
        id: `e-${branchIndex}`,
        from: 'n-entry',
        to: `n-term-${branchIndex % terminalCount}`,
        label: `branch ${branchIndex}`,
      }),
    ),
  });
});

describe('questSummaryBuildTransformer', () => {
  describe('per-flow, per-track counts', () => {
    it('VALID: {one runtime flow, no work items} => every eligible unit is outstanding on every denominator that measures it', () => {
      const quest = QuestStub({
        flows: [FlowStub({ nodes: LOGIN_NODES, edges: LOGIN_EDGES })],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {off-map family on flow} => counts against siegemaster only', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: LOGIN_NODES,
            edges: LOGIN_EDGES,
            offMapSignoffs: [FlowOffMapSignoffStub({ id: 'concurrency' })],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {operational flow} => carries codeweaver row, not flowrider or siegemaster', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'lint-rule-registration',
            name: 'Register the lint rule',
            flowType: 'operational',
            nodes: LOGIN_NODES,
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'lint-rule-registration',
          name: 'Register the lint rule',
          flowType: 'operational',
          // Codeweaver measures BOTH flow types — it builds an operational flow's code exactly as
          // it builds a runtime one's — so it carries a row here where Flowrider and Siegemaster
          // (runtime-only under stepScopeStatics) do not.
          tracks: [{ id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 }],
        },
      ]);
    });

    it('VALID: {two flows} => reports each flow separately, in quest order', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({ id: 'first-flow', name: 'First', nodes: LOGIN_NODES, edges: LOGIN_EDGES }),
          FlowStub({ id: 'second-flow', name: 'Second', nodes: [], edges: [] }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'first-flow',
          name: 'First',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 9 },
          ],
        },
        {
          id: 'second-flow',
          name: 'Second',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 0 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 0 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 7 },
          ],
        },
      ]);
    });
  });

  describe('marks counted per track', () => {
    it('EMPTY: {no work items at all} => every unit is outstanding and no unit is met, cant-meet or unmet', () => {
      const quest = QuestStub({ flows: [MARKED_FLOW], workItems: [] });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 4 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 4 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 11 },
          ],
        },
      ]);
    });

    it('VALID: {flowrider marks one unit met} => flowrider counts it as met alone and drops it from outstanding', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'met',
                evidence:
                  'packages/web/src/flows/login/login.e2e.ts:18 — red when the form is hidden',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[1]).toStrictEqual({
        id: 'flowrider',
        met: 1,
        cantMeet: 0,
        unmet: 0,
        outstanding: 3,
      });
    });

    it('VALID: {codeweaver marks the unit met, flowrider marks nothing} => the unit stays outstanding on flowrider', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: CODEWEAVER_ITEM_ID,
            role: 'codeweaver',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'met',
                evidence: 'packages/web/src/widgets/login-form/login-form-widget.test.tsx:31',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      // R2: two roles produce two independent verdicts on one unit. Codeweaver's `met` settles
      // codeweaver's row and NOTHING on flowrider's, where the unit is still unlooked-at.
      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 1, cantMeet: 0, unmet: 0, outstanding: 3 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 4 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 11 },
          ],
        },
      ]);
    });

    it('VALID: {flowrider marks a unit cant-meet} => it counts as cantMeet, never as unmet or outstanding', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:rejects-empty-password',
                mark: 'cant-meet',
                evidence:
                  'playwright.config.ts declares no webServer, so no e2e run reaches the app',
                toSettle: 'Add a webServer block to playwright.config.ts, then re-run this spec.',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[1]).toStrictEqual({
        id: 'flowrider',
        met: 0,
        cantMeet: 1,
        unmet: 0,
        outstanding: 3,
      });
    });

    it('VALID: {flowrider marks a unit unmet} => it counts as unmet and is NOT folded into outstanding', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:rejects-empty-password',
                mark: 'unmet',
                evidence:
                  'the 422 branch has no assertion yet; the request helper is already written',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      // `unmet` is a session that LOOKED and left work open; `outstanding` is a unit nobody has
      // marked. Folding the first into the second would leave outstanding at 4 and lose the fact
      // that a successor is already owed this unit.
      expect(result.flows[0]?.tracks[1]).toStrictEqual({
        id: 'flowrider',
        met: 0,
        cantMeet: 0,
        unmet: 1,
        outstanding: 3,
      });
    });

    it('VALID: {one met, one cant-meet, one unmet, one untouched} => the four counts partition the denominator', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:terminal:dashboard',
                mark: 'met',
                evidence:
                  'packages/web/src/flows/login/login.e2e.ts:44 — asserts the dashboard URL',
              }),
              UnitObservationStub({
                unitId: 'login-flow:branch:e-success',
                mark: 'cant-meet',
                evidence: 'the success edge is only reachable with a seeded session cookie',
                toSettle: 'Seed a session cookie in the e2e harness, then walk the success edge.',
              }),
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'unmet',
                evidence: 'the spec file exists but asserts nothing about the form yet',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[1]).toStrictEqual({
        id: 'flowrider',
        met: 1,
        cantMeet: 1,
        unmet: 1,
        outstanding: 1,
      });
    });

    it('VALID: {flowrider marks an off-map unit met} => it lands in no count, off-map is outside flowrider’s denominator', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:off-map:concurrency',
                mark: 'met',
                evidence: 'two parallel logins resolve to one session',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[1]).toStrictEqual({
        id: 'flowrider',
        met: 0,
        cantMeet: 0,
        unmet: 0,
        outstanding: 4,
      });
    });

    it('VALID: {siegemaster marks an off-map unit met} => siegemaster counts it, the family is its charter', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: SIEGEMASTER_ITEM_ID,
            role: 'siegemaster',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:off-map:concurrency',
                mark: 'met',
                evidence: 'two parallel logins resolve to one session',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[2]).toStrictEqual({
        id: 'siegemaster',
        met: 1,
        cantMeet: 0,
        unmet: 0,
        outstanding: 10,
      });
    });

    it('VALID: {an unmet flowrider item followed by its successor marking met} => the later work item is the track’s verdict', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'unmet',
                evidence: 'ran out of budget before the form assertion landed',
              }),
            ],
          }),
          WorkItemStub({
            id: FLOWRIDER_SUCCESSOR_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'met',
                evidence:
                  'packages/web/src/flows/login/login.e2e.ts:18 — red when the form is hidden',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[1]).toStrictEqual({
        id: 'flowrider',
        met: 1,
        cantMeet: 0,
        unmet: 0,
        outstanding: 3,
      });
    });

    it('VALID: {marks spread over all three tracks} => every row’s four counts add up to that track’s denominator', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: CODEWEAVER_ITEM_ID,
            role: 'codeweaver',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'met',
                evidence: 'packages/web/src/widgets/login-form/login-form-widget.test.tsx:31',
              }),
            ],
          }),
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:branch:e-success',
                mark: 'unmet',
                evidence: 'the success edge still has no walk',
              }),
              UnitObservationStub({
                unitId: 'login-flow:terminal:dashboard',
                mark: 'cant-meet',
                evidence: 'the dashboard route is behind a feature flag this suite cannot set',
                toSettle: 'Expose the flag through the e2e harness, then assert the dashboard.',
              }),
            ],
          }),
          WorkItemStub({
            id: SIEGEMASTER_ITEM_ID,
            role: 'siegemaster',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:off-map:concurrency',
                mark: 'met',
                evidence: 'two parallel logins resolve to one session',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      const rows = result.flows.flatMap((flow) => flow.tracks);

      expect(rows).toStrictEqual([
        { id: 'codeweaver', met: 1, cantMeet: 0, unmet: 0, outstanding: 3 },
        { id: 'flowrider', met: 0, cantMeet: 1, unmet: 1, outstanding: 2 },
        { id: 'siegemaster', met: 1, cantMeet: 0, unmet: 0, outstanding: 10 },
      ]);
      // The denominators the rows above are measured over: 4 units for each authoring track,
      // 11 for siegemaster. Every row's four counts reconcile against its own.
      expect(rows.map((row) => row.met + row.cantMeet + row.unmet + row.outstanding)).toStrictEqual(
        [4, 4, 11],
      );
    });
  });

  describe('the debt list', () => {
    it('EMPTY: {no work items} => nothing is in debt, because an unmarked unit is outstanding rather than owed', () => {
      const quest = QuestStub({ flows: [MARKED_FLOW], workItems: [] });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([]);
    });

    it('VALID: {a met mark} => the proven unit is absent from the debt list', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'met',
                evidence:
                  'packages/web/src/flows/login/login.e2e.ts:18 — red when the form is hidden',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([]);
    });

    it('VALID: {a cant-meet mark} => one debt entry carrying its evidence, its toSettle and the work item that raised it', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:rejects-empty-password',
                mark: 'cant-meet',
                evidence:
                  'playwright.config.ts declares no webServer, so no e2e run reaches the app',
                toSettle: 'Add a webServer block to playwright.config.ts, then re-run this spec.',
                at: '2026-02-03T09:15:00.000Z',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([
        {
          id: 'login-flow:observable:rejects-empty-password:flowrider',
          unitId: 'login-flow:observable:rejects-empty-password',
          flowId: 'login-flow',
          kind: 'observable',
          track: 'flowrider',
          mark: 'cant-meet',
          evidence: 'playwright.config.ts declares no webServer, so no e2e run reaches the app',
          toSettle: 'Add a webServer block to playwright.config.ts, then re-run this spec.',
          workItemId: FLOWRIDER_ITEM_ID,
          at: '2026-02-03T09:15:00.000Z',
        },
      ]);
    });

    it('VALID: {an unmet mark} => one debt entry with NO toSettle, because a successor is owed it rather than a handover', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:branch:e-success',
                mark: 'unmet',
                evidence: 'the success edge still has no walk; the login helper is already written',
                at: '2026-02-03T11:45:00.000Z',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([
        {
          id: 'login-flow:branch:e-success:flowrider',
          unitId: 'login-flow:branch:e-success',
          flowId: 'login-flow',
          kind: 'branch',
          track: 'flowrider',
          mark: 'unmet',
          evidence: 'the success edge still has no walk; the login helper is already written',
          workItemId: FLOWRIDER_ITEM_ID,
          at: '2026-02-03T11:45:00.000Z',
        },
      ]);
    });

    it('VALID: {two tracks short on one unit} => two entries, keyed on the unit crossed with the track', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: CODEWEAVER_ITEM_ID,
            role: 'codeweaver',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'cant-meet',
                evidence: 'the form is rendered by a package this cell does not own',
                toSettle: 'Move the form widget into this package, then unit-test its render.',
                at: '2026-02-03T08:00:00.000Z',
              }),
            ],
          }),
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'unmet',
                evidence: 'the spec file exists but asserts nothing about the form yet',
                at: '2026-02-03T12:30:00.000Z',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([
        {
          id: 'login-flow:observable:shows-form:codeweaver',
          unitId: 'login-flow:observable:shows-form',
          flowId: 'login-flow',
          kind: 'observable',
          track: 'codeweaver',
          mark: 'cant-meet',
          evidence: 'the form is rendered by a package this cell does not own',
          toSettle: 'Move the form widget into this package, then unit-test its render.',
          workItemId: CODEWEAVER_ITEM_ID,
          at: '2026-02-03T08:00:00.000Z',
        },
        {
          id: 'login-flow:observable:shows-form:flowrider',
          unitId: 'login-flow:observable:shows-form',
          flowId: 'login-flow',
          kind: 'observable',
          track: 'flowrider',
          mark: 'unmet',
          evidence: 'the spec file exists but asserts nothing about the form yet',
          workItemId: FLOWRIDER_ITEM_ID,
          at: '2026-02-03T12:30:00.000Z',
        },
      ]);
    });

    it('VALID: {an unmet superseded by a met} => the settled unit leaves the debt list with the count', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'unmet',
                evidence: 'ran out of budget before the form assertion landed',
              }),
            ],
          }),
          WorkItemStub({
            id: FLOWRIDER_SUCCESSOR_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:shows-form',
                mark: 'met',
                evidence:
                  'packages/web/src/flows/login/login.e2e.ts:18 — red when the form is hidden',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([]);
    });

    it('VALID: {a cant-meet on a unit outside the marking track’s denominator} => no debt entry, the unit was never measured there', () => {
      const quest = QuestStub({
        flows: [MARKED_FLOW],
        workItems: [
          WorkItemStub({
            id: FLOWRIDER_ITEM_ID,
            role: 'flowrider',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:off-map:concurrency',
                mark: 'cant-meet',
                evidence: 'no lane is allocated to this suite',
                toSettle: 'Allocate a siegelense lane, then drive two parallel logins through it.',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.debt).toStrictEqual([]);
    });
  });

  describe('mid-quest observables', () => {
    it('VALID: {observable added by siegemaster} => listed with its author and its verbatim text', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.midQuestObservables).toStrictEqual([
        {
          id: 'login-flow:observable:crash-on-bleh',
          flowId: 'login-flow',
          nodeId: 'login-page',
          observableId: 'crash-on-bleh',
          addedBy: 'siegemaster',
          observableType: 'api-call',
          description: 'POST /api/auth/login returns 400 for a non-JSON body',
        },
      ]);
    });

    it('VALID: {spec observable beside a codeweaver one} => only the mid-quest addition is listed', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'shows-form',
                    type: 'ui-state',
                    description: 'shows the login form',
                  }),
                  FlowObservableStub({
                    id: 'rejects-empty-password',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 422 for an empty password',
                    addedBy: 'codeweaver',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.midQuestObservables).toStrictEqual([
        {
          id: 'login-flow:observable:rejects-empty-password',
          flowId: 'login-flow',
          nodeId: 'login-page',
          observableId: 'rejects-empty-password',
          addedBy: 'codeweaver',
          observableType: 'api-call',
          description: 'POST /api/auth/login returns 422 for an empty password',
        },
      ]);
    });

    it('EMPTY: {every observable from the spec} => the drift list is empty', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'shows-form',
                    type: 'ui-state',
                    description: 'shows the login form',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.midQuestObservables).toStrictEqual([]);
    });
  });

  describe('the provenance exclusion', () => {
    it('VALID: {siegemaster-added observable} => absent from the authoring counts, present in siegemaster', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      // Codeweaver and Flowrider both stay at 2 (the terminal and the branch). The observable
      // Siegemaster added mid-walk did not exist while either authoring track was working, so
      // counting it would report a hole no authoring session could ever close. Siegemaster carries
      // it: 1 + 1 + 1 + 7 off-map = 10.
      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 10 },
          ],
        },
      ]);
    });

    it('VALID: {flowrider-added observable} => counts for every denominator, it is after none of them', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'rejects-empty-password',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 422 for an empty password',
                    addedBy: 'flowrider',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 3 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 3 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 10 },
          ],
        },
      ]);
    });

    it('VALID: {codeweaver marks a siegemaster-added observable} => the mark lands in no codeweaver count', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'crash-on-bleh',
                    type: 'api-call',
                    description: 'POST /api/auth/login returns 400 for a non-JSON body',
                    addedBy: 'siegemaster',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: CODEWEAVER_ITEM_ID,
            role: 'codeweaver',
            observations: [
              UnitObservationStub({
                unitId: 'login-flow:observable:crash-on-bleh',
                mark: 'met',
                evidence:
                  'packages/server/src/responders/auth-login/auth-login-responder.test.ts:12',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows[0]?.tracks[0]).toStrictEqual({
        id: 'codeweaver',
        met: 0,
        cantMeet: 0,
        unmet: 0,
        outstanding: 2,
      });
    });
  });

  describe('the verifyByHuman filter', () => {
    it('VALID: {observable flagged verifyByHuman} => excluded from every track’s counts, not merely folded into outstanding', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'looks-right-to-a-person',
                    type: 'ui-state',
                    description: 'the new layout looks right',
                    verifyByHuman: true,
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      // No track's `verificationMethods` lists `human-check`, so this unit drops out of the
      // denominator entirely: the same 1 terminal + 1 branch every LOGIN_NODES-based test carries,
      // with the flagged observable adding to no track's count at all.
      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 2 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {observable flagged both verifyByReading and verifyByHuman} => still excluded everywhere — verifyByHuman wins even where codeweaver would otherwise accept reading', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'imports-the-shared-limit-and-looks-right',
                    type: 'ui-state',
                    description: 'the widget imports the shared limit AND the layout looks right',
                    verifyByReading: true,
                    verifyByHuman: true,
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      // Codeweaver's `verificationMethods` includes `reading`, so an UNflagged `verifyByReading`
      // unit would count there. `verifyByHuman` wins regardless, so this unit is absent from
      // codeweaver's count too — 2, not 3.
      expect(result.flows[0]?.tracks[0]).toStrictEqual({
        id: 'codeweaver',
        met: 0,
        cantMeet: 0,
        unmet: 0,
        outstanding: 2,
      });
    });

    it('VALID: {observable with neither flag set} => counted exactly as before, the filter leaves it alone', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                type: 'state',
                observables: [
                  FlowObservableStub({
                    id: 'shows-form',
                    type: 'ui-state',
                    description: 'shows the login form',
                  }),
                ],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', type: 'state' }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 3 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 3 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 10 },
          ],
        },
      ]);
    });
  });

  describe('quest notes grouped by kind', () => {
    it('VALID: {one note of each kind, plus a second open question} => one group per kind, in quest order, with a walked note keeping its branded ids', () => {
      const quest = QuestStub({
        flows: [],
        planningNotes: {
          blightLedger: [],
          questNotes: [
            QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' }),
            QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' }),
            QuestNoteStub({ id: 'out-of-scope-legacy-panel', kind: 'out-of-scope' }),
            QuestNoteStub({ id: 'walk-reset-after-anchor-fix', kind: 'walk-reset' }),
            QuestNoteStub({ id: 'open-question-batch-notify', kind: 'open-question' }),
            QuestNoteStub({
              id: 'walked-login-flow-path-3',
              kind: 'walked',
              instanceId: 'inst_9b2c1234',
              runId: 'run_2',
            }),
          ],
          operationPlans: [],
        },
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.noteGroups).toStrictEqual([
        {
          id: 'open-question',
          notes: [
            QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' }),
            QuestNoteStub({ id: 'open-question-batch-notify', kind: 'open-question' }),
          ],
        },
        {
          id: 'tooling-error',
          notes: [QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' })],
        },
        {
          id: 'out-of-scope',
          notes: [QuestNoteStub({ id: 'out-of-scope-legacy-panel', kind: 'out-of-scope' })],
        },
        {
          id: 'walk-reset',
          notes: [QuestNoteStub({ id: 'walk-reset-after-anchor-fix', kind: 'walk-reset' })],
        },
        {
          id: 'walked',
          notes: [
            QuestNoteStub({
              id: 'walked-login-flow-path-3',
              kind: 'walked',
              instanceId: 'inst_9b2c1234',
              runId: 'run_2',
            }),
          ],
        },
        { id: 'human-verdict', notes: [] },
      ]);
      expect(result.noteGroups[4]?.notes[0]?.instanceId).toBe('inst_9b2c1234');
      expect(result.noteGroups[4]?.notes[0]?.runId).toBe('run_2');
    });

    it('EMPTY: {no notes} => every kind still gets a group, so "none" is stated rather than implied', () => {
      const quest = QuestStub({ flows: [] });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.noteGroups).toStrictEqual([
        { id: 'open-question', notes: [] },
        { id: 'tooling-error', notes: [] },
        { id: 'out-of-scope', notes: [] },
        { id: 'walk-reset', notes: [] },
        { id: 'walked', notes: [] },
        { id: 'human-verdict', notes: [] },
      ]);
    });
  });

  describe('empty quest', () => {
    it('EMPTY: {no flows, no notes} => empty coverage, drift and debt with the note skeleton intact', () => {
      const quest = QuestStub({ id: 'add-auth', flows: [] });

      const result = questSummaryBuildTransformer({ quest });

      expect(result).toStrictEqual({
        questId: 'add-auth',
        flows: [],
        midQuestObservables: [],
        debt: [],
        noteGroups: [
          { id: 'open-question', notes: [] },
          { id: 'tooling-error', notes: [] },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
          { id: 'walked', notes: [] },
          { id: 'human-verdict', notes: [] },
        ],
      });
    });

    it('EMPTY: {flow with no nodes or edges} => only the 7 off-map families remain, on siegemaster', () => {
      const quest = QuestStub({ flows: [FlowStub({ nodes: [], edges: [] })] });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 0 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 0 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 7 },
          ],
        },
      ]);
    });
  });

  describe('scale — 281 verification units across 7 flows', () => {
    it('VALID: {19 terminals + 85 branches + 128 observables + 49 off-map} => per-flow counts hold', () => {
      const quest = QuestStub({ id: 'scale-quest', flows: SCALE_FLOWS });

      const result = questSummaryBuildTransformer({ quest });

      // Flow 0: 7 terminals + 13 branches + 20 observables + 7 off-map = 47 siegemaster units.
      // The two authoring denominators — codeweaver and flowrider — drop the 7 off-map families
      // AND the one observable Siegemaster added mid-walk, leaving 7 + 13 + 19 = 39 each. Flows
      // 1-6: 2 + 12 + 18 + 7 = 39 siegemaster, 2 + 12 + 18 = 32 each authoring. Every track now
      // carries the full packageTypes list, so neither authoring row is narrowed by package kind.
      expect(result.flows).toStrictEqual([
        {
          id: 'scale-flow-0',
          name: 'Scale Flow 0',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 47 },
          ],
        },
        {
          id: 'scale-flow-1',
          name: 'Scale Flow 1',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-2',
          name: 'Scale Flow 2',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-3',
          name: 'Scale Flow 3',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-4',
          name: 'Scale Flow 4',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-5',
          name: 'Scale Flow 5',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-6',
          name: 'Scale Flow 6',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'flowrider', met: 0, cantMeet: 0, unmet: 0, outstanding: 32 },
            { id: 'siegemaster', met: 0, cantMeet: 0, unmet: 0, outstanding: 39 },
          ],
        },
      ]);
    });

    it('VALID: {281 units} => siegemaster owns all 281 and each authoring denominator owns 231', () => {
      const quest = QuestStub({ id: 'scale-quest', flows: SCALE_FLOWS });

      const result = questSummaryBuildTransformer({ quest });

      const totalsByTrack = signoffTracksStatics.denominators.map((wanted) =>
        result.flows
          .flatMap((flow) => flow.tracks)
          .filter((track) => track.id === wanted)
          .reduce(
            (sum, track) => sum + track.met + track.cantMeet + track.unmet + track.outstanding,
            0,
          ),
      );

      // 281 total units; the authoring denominators shed the 49 off-map families and the single
      // siegemaster-added observable, leaving 231. Codeweaver and Flowrider read the same unit
      // kinds and observable origins, so they land on the same total.
      expect(totalsByTrack).toStrictEqual([231, 231, 281]);
    });

    it('VALID: {one siegemaster-added observable among 128} => it is the only drift entry', () => {
      const quest = QuestStub({ id: 'scale-quest', flows: SCALE_FLOWS });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.midQuestObservables).toStrictEqual([
        {
          id: 'scale-flow-0:observable:obs-0',
          flowId: 'scale-flow-0',
          nodeId: 'n-entry',
          observableId: 'obs-0',
          addedBy: 'siegemaster',
          observableType: 'ui-state',
          description: 'observable 0 on flow 0',
        },
      ]);
    });
  });
});
