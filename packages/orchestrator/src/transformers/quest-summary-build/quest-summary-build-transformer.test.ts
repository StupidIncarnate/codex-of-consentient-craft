import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  QuestNoteStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

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
    it('VALID: {one runtime flow, no sign-offs} => every eligible unit is outstanding on both tracks', () => {
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
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {off-map family signed by siegemaster} => counts against siegemaster only', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: LOGIN_NODES,
            edges: LOGIN_EDGES,
            offMapSignoffs: [
              FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff: SignoffStub() }),
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
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 1, unconfirmable: 0, outstanding: 8 },
          ],
        },
      ]);
    });

    it('VALID: {operational flow} => carries a siegemaster row and no flowrider row', () => {
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
          tracks: [{ id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 }],
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
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
        {
          id: 'second-flow',
          name: 'Second',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 0 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 7 },
          ],
        },
      ]);
    });
  });

  describe('one track signing without the other', () => {
    it('VALID: {terminal signed by flowrider alone} => confirmed on flowrider, still outstanding on siegemaster', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                flowriderSignoff: SignoffStub(),
              }),
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
            { id: 'flowrider', confirmed: 1, unconfirmable: 0, outstanding: 1 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 9 },
          ],
        },
      ]);
    });

    it('VALID: {branch signed by both tracks} => confirmed on both, outstanding drops on both', () => {
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
                flowriderSignoff: SignoffStub(),
                siegemasterSignoff: SignoffStub(),
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
            { id: 'flowrider', confirmed: 1, unconfirmable: 0, outstanding: 1 },
            { id: 'siegemaster', confirmed: 1, unconfirmable: 0, outstanding: 8 },
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
    it('VALID: {siegemaster-added observable} => absent from flowrider counts, present in siegemaster', () => {
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

      // Flowrider stays at 2 (the terminal and the branch). The observable Siegemaster added
      // mid-walk did not exist while Flowrider was authoring, so counting it would report a hole no
      // Flowrider session could ever close. Siegemaster carries it: 1 + 1 + 1 + 7 off-map = 10.
      expect(result.flows).toStrictEqual([
        {
          id: 'login-flow',
          name: 'Login Flow',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 2 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 10 },
          ],
        },
      ]);
    });

    it('VALID: {flowrider-added observable} => counts for BOTH tracks, it is after neither', () => {
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
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 3 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 10 },
          ],
        },
      ]);
    });

    it('VALID: {siegemaster-added observable signed by siegemaster} => the debt entry names the siegemaster track', () => {
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
                    siegemasterSignoff: SignoffStub({
                      verdict: 'unconfirmable',
                      evidence: 'the endpoint 500s before any validation runs',
                      question: 'Should the router reject a non-JSON body before the handler?',
                    }),
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

      expect(result.unconfirmable).toStrictEqual([
        {
          id: 'login-flow:observable:crash-on-bleh:siegemaster',
          unitId: 'login-flow:observable:crash-on-bleh',
          flowId: 'login-flow',
          kind: 'observable',
          track: 'siegemaster',
          signoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'the endpoint 500s before any validation runs',
            question: 'Should the router reject a non-JSON body before the handler?',
          }),
        },
      ]);
    });
  });

  describe('unconfirmable verdicts', () => {
    it('VALID: {terminal unconfirmable on flowrider} => surfaces the reason and the question', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                flowriderSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence:
                    'playwright.config.ts declares no webServer, so no e2e run can reach the app',
                  question: 'Who owns adding a webServer block to playwright.config.ts?',
                }),
              }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([
        {
          id: 'login-flow:terminal:dashboard:flowrider',
          unitId: 'login-flow:terminal:dashboard',
          flowId: 'login-flow',
          kind: 'terminal',
          track: 'flowrider',
          signoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'playwright.config.ts declares no webServer, so no e2e run can reach the app',
            question: 'Who owns adding a webServer block to playwright.config.ts?',
          }),
        },
      ]);
    });

    it('VALID: {one unit unconfirmable on both tracks} => two entries, keyed unit-crossed-with-track', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                flowriderSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence: 'no webServer is declared for the e2e run',
                  question: 'Who owns adding a webServer block?',
                }),
                siegemasterSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence: 'the dev server refuses to bind port 3737 in this sandbox',
                  question: 'Which port should the sandbox dev server use?',
                }),
              }),
            ],
            edges: LOGIN_EDGES,
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([
        {
          id: 'login-flow:terminal:dashboard:flowrider',
          unitId: 'login-flow:terminal:dashboard',
          flowId: 'login-flow',
          kind: 'terminal',
          track: 'flowrider',
          signoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'no webServer is declared for the e2e run',
            question: 'Who owns adding a webServer block?',
          }),
        },
        {
          id: 'login-flow:terminal:dashboard:siegemaster',
          unitId: 'login-flow:terminal:dashboard',
          flowId: 'login-flow',
          kind: 'terminal',
          track: 'siegemaster',
          signoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'the dev server refuses to bind port 3737 in this sandbox',
            question: 'Which port should the sandbox dev server use?',
          }),
        },
      ]);
    });

    it('VALID: {off-map family unconfirmable} => surfaces with its family unit id', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: LOGIN_NODES,
            edges: LOGIN_EDGES,
            offMapSignoffs: [
              FlowOffMapSignoffStub({
                id: 'perf',
                siegemasterSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence: 'the sandbox has no way to generate representative load',
                  question: 'Where should the load profile for this flow come from?',
                }),
              }),
            ],
          }),
        ],
      });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.unconfirmable).toStrictEqual([
        {
          id: 'login-flow:off-map:perf:siegemaster',
          unitId: 'login-flow:off-map:perf',
          flowId: 'login-flow',
          kind: 'off-map',
          track: 'siegemaster',
          signoff: SignoffStub({
            verdict: 'unconfirmable',
            evidence: 'the sandbox has no way to generate representative load',
            question: 'Where should the load profile for this flow come from?',
          }),
        },
      ]);
    });

    it('VALID: {confirmed sign-off} => never appears in the unconfirmable list', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page', type: 'state' }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                type: 'state',
                flowriderSignoff: SignoffStub(),
                siegemasterSignoff: SignoffStub(),
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
    it('VALID: {one note of each kind, plus a second open question} => one group per kind, in quest order', () => {
      const quest = QuestStub({
        flows: [],
        planningNotes: {
          blightReports: [],
          qaLedger: [],
          blightLedger: [],
          questNotes: [
            QuestNoteStub({ id: 'open-question-anchor-scope', kind: 'open-question' }),
            QuestNoteStub({ id: 'tooling-error-ward-oom', kind: 'tooling-error' }),
            QuestNoteStub({ id: 'out-of-scope-legacy-panel', kind: 'out-of-scope' }),
            QuestNoteStub({ id: 'walk-reset-after-anchor-fix', kind: 'walk-reset' }),
            QuestNoteStub({ id: 'open-question-batch-notify', kind: 'open-question' }),
          ],
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
      ]);
    });

    it('EMPTY: {no notes} => every kind still gets a group, so "none" is stated rather than implied', () => {
      const quest = QuestStub({ flows: [] });

      const result = questSummaryBuildTransformer({ quest });

      expect(result.noteGroups).toStrictEqual([
        { id: 'open-question', notes: [] },
        { id: 'tooling-error', notes: [] },
        { id: 'out-of-scope', notes: [] },
        { id: 'walk-reset', notes: [] },
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
      // Flowrider drops the 7 off-map families AND the one observable Siegemaster added mid-walk,
      // leaving 7 + 13 + 19 = 39. Flows 1-6: 2 + 12 + 18 + 7 = 39 siegemaster, 2 + 12 + 18 = 32
      // flowrider.
      expect(result.flows).toStrictEqual([
        {
          id: 'scale-flow-0',
          name: 'Scale Flow 0',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 39 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 47 },
          ],
        },
        {
          id: 'scale-flow-1',
          name: 'Scale Flow 1',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-2',
          name: 'Scale Flow 2',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-3',
          name: 'Scale Flow 3',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-4',
          name: 'Scale Flow 4',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-5',
          name: 'Scale Flow 5',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
        {
          id: 'scale-flow-6',
          name: 'Scale Flow 6',
          flowType: 'runtime',
          tracks: [
            { id: 'flowrider', confirmed: 0, unconfirmable: 0, outstanding: 32 },
            { id: 'siegemaster', confirmed: 0, unconfirmable: 0, outstanding: 39 },
          ],
        },
      ]);
    });

    it('VALID: {281 units} => siegemaster owns all 281 and flowrider owns 231', () => {
      const quest = QuestStub({ id: 'scale-quest', flows: SCALE_FLOWS });

      const result = questSummaryBuildTransformer({ quest });

      const flowriderTotal = result.flows
        .flatMap((flow) => flow.tracks)
        .filter((track) => track.id === 'flowrider')
        .reduce((sum, track) => sum + track.confirmed + track.unconfirmable + track.outstanding, 0);
      const siegemasterTotal = result.flows
        .flatMap((flow) => flow.tracks)
        .filter((track) => track.id === 'siegemaster')
        .reduce((sum, track) => sum + track.confirmed + track.unconfirmable + track.outstanding, 0);

      // 281 total units; Flowrider sheds the 49 off-map families and the single siegemaster-added
      // observable, leaving 231.
      expect([flowriderTotal, siegemasterTotal]).toStrictEqual([231, 281]);
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
