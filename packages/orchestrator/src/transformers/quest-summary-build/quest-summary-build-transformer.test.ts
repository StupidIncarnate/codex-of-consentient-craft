import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  QuestNoteStub,
  QuestStub,
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
    it('VALID: {one runtime flow, no sign-offs} => every eligible unit is outstanding on every denominator that measures it', () => {
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
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
          tracks: [{ id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 }],
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
        {
          id: 'second-flow',
          name: 'Second',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 0 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 0 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 7 },
          ],
        },
      ]);
    });
  });

  describe('sign-off fields retired from units', () => {
    it('VALID: {terminal on flow} => reported as outstanding on all measuring tracks with 0 confirmed', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {branch on flow} => reported as outstanding on all measuring tracks with 0 confirmed', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: LOGIN_NODES,
            edges: [
              FlowEdgeStub({
                id: 'e-success',
                from: 'login-page',
                to: 'dashboard',
                label: 'success',
              }),
            ],
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
      ]);
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 10 },
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 3 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 3 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 10 },
          ],
        },
      ]);
    });

    it('VALID: {siegemaster-added observable} => debt list is empty after sign-off retirement', () => {
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

      expect(result.unconfirmable).toStrictEqual([]);
    });
  });

  describe('unconfirmable debt list after sign-off retirement', () => {
    it('VALID: {terminal node} => debt list is empty', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
              }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([]);
    });

    it('VALID: {multiple nodes on flow} => debt list is empty', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
              }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([]);
    });

    it('VALID: {off-map family} => debt list is empty', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: LOGIN_NODES,
            edges: LOGIN_EDGES,
            offMapSignoffs: [
              FlowOffMapSignoffStub({
                id: 'perf',
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([]);
    });

    it('EMPTY: {flow with nodes} => debt list is empty', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
              }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([]);
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
        unconfirmable: [],
        noteGroups: [
          { id: 'open-question', notes: [] },
          { id: 'tooling-error', notes: [] },
          { id: 'out-of-scope', notes: [] },
          { id: 'walk-reset', notes: [] },
          { id: 'walked', notes: [] },
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 0 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 0 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 7 },
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
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 39 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 39 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 47 },
          ],
        },
        {
          id: 'scale-flow-1',
          name: 'Scale Flow 1',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-2',
          name: 'Scale Flow 2',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-3',
          name: 'Scale Flow 3',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-4',
          name: 'Scale Flow 4',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-5',
          name: 'Scale Flow 5',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-6',
          name: 'Scale Flow 6',
          flowType: 'runtime',
          tracks: [
            { id: 'codeweaver', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
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
            (sum, track) => sum + track.confirmed + track.unconfirmable + track.outstanding,
            0,
          ),
      );

      // 281 total units; the authoring denominators shed the 49 off-map families and the single
      // siegemaster-added observable, leaving 231. Codeweaver and Flowrider read the same unit
      // kinds and observable origins and neither's own field is ever set here, so they land on the
      // same total.
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
