import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics, workItemRoleStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaChecklistBuildTransformer } from '../qa-checklist-build/qa-checklist-build-transformer';
import { signoffOutstandingTransformer } from './signoff-outstanding-transformer';

// The off-map probe families every flow decomposes into. Derived from the probe statics, whose keys
// its own colocated test pins 1:1 with qaOffMapFamilyContract's options — `enforce-contract-usage-
// in-tests` rejects a `@dungeonmaster/shared/contracts` import whose specifiers are not all stubs,
// so a test file cannot read the contract's options and this is the honest source for the count.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);
const OFF_MAP_FAMILY_COUNT = OFF_MAP_FAMILIES.length;

// Every role the gate must NOT bind, derived from the role tuple so a newly added role is swept in
// automatically instead of being silently skipped by a hand-maintained list.
const GATED_ROLES = new Set(['flowrider', 'siegemaster']);
const UNGATED_ROLES = workItemRoleStatics.names.filter((role) => !GATED_ROLES.has(role));

// The full observable-origin set, taken from the track that excludes nothing, split into the two
// halves Flowrider's denominator treats differently.
const ALL_OBSERVABLE_ORIGINS = signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins;
const FLOWRIDER_ELIGIBLE_ORIGINS =
  signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins;
const FLOWRIDER_ELIGIBLE_SET = new Set(FLOWRIDER_ELIGIBLE_ORIGINS.map(String));
const FLOWRIDER_EXCLUDED_ORIGINS = ALL_OBSERVABLE_ORIGINS.filter(
  (origin) => !FLOWRIDER_ELIGIBLE_SET.has(origin),
);

// The real yardstick a quest of this repo's size produces: 7 flows carrying 19 terminals, 85
// labelled branches and 128 observables, plus one off-map unit per family per flow — 281 units the
// gate enumerates synchronously on every `done` from these two roles. Built entirely from stubs,
// never from ~/.dungeonmaster, which is machine-dependent and would make this a record of one
// laptop rather than of the yardstick.
const SCALE_TERMINALS_PER_FLOW = [3, 3, 3, 3, 3, 2, 2];
const SCALE_BRANCHES_PER_FLOW = [13, 13, 13, 12, 12, 11, 11];
const SCALE_OBSERVABLES_PER_FLOW = [19, 19, 18, 18, 18, 18, 18];

describe('signoffOutstandingTransformer', () => {
  describe('items the gate does not bind', () => {
    it.each(UNGATED_ROLES)(
      'VALID: {role: %s} => returns nothing, because only the two verification tracks are gated here',
      (role) => {
        const quest = QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
              edges: [],
            }),
          ],
        });

        expect(
          signoffOutstandingTransformer({
            quest,
            operationItem: OperationItemStub({ role, flowIds: ['login-flow'] }),
          }),
        ).toStrictEqual([]);
      },
    );

    it('EMPTY: {siegemaster item declaring no flowIds} => nothing outstanding, so a flow-less quest and pre-gate items still complete', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: [] }),
        }),
      ).toStrictEqual([]);
    });

    it('EMPTY: {siegemaster flowId not on the quest} => contributes nothing outstanding', () => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] })],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['gone-flow'] }),
        }),
      ).toStrictEqual([]);
    });
  });

  describe('every unit kind is enumerated', () => {
    it('VALID: {siegemaster, a flow with terminals, branches and an observable} => every terminal, branch, observable and off-map family is outstanding, in checklist order', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                label: 'Login Page',
                observables: [FlowObservableStub({ id: 'shows-form' })],
              }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
              FlowNodeStub({ id: 'error-banner', label: 'Error Banner' }),
            ],
            edges: [
              FlowEdgeStub({
                id: 'login-to-dashboard',
                from: 'login-page',
                to: 'dashboard',
                label: 'success',
              }),
              FlowEdgeStub({
                id: 'login-to-error',
                from: 'login-page',
                to: 'error-banner',
                label: 'bad credentials',
              }),
            ],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual([
        'login-flow:terminal:dashboard',
        'login-flow:terminal:error-banner',
        'login-flow:branch:login-to-dashboard',
        'login-flow:branch:login-to-error',
        'login-flow:observable:shows-form',
        ...OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      ]);
    });

    it("EDGE: {a node typed 'terminal' that still has an outgoing edge} => it is NOT a terminal unit; the node it points at is", () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'looks-terminal', label: 'Looks Terminal', type: 'terminal' }),
              FlowNodeStub({ id: 'really-last', label: 'Really Last', type: 'state' }),
            ],
            edges: [FlowEdgeStub({ id: 'onward', from: 'looks-terminal', to: 'really-last' })],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual(['login-flow:terminal:really-last']);
    });

    it('EDGE: {an unlabelled edge} => contributes no branch unit, because there is no decision to force', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'login-page', label: 'Login Page' }),
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
            ],
            edges: [FlowEdgeStub({ id: 'onward', from: 'login-page', to: 'dashboard' })],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard']);
    });
  });

  describe('id parity with qaChecklistBuildTransformer', () => {
    it('VALID: {an unsigned runtime flow, siegemaster track} => the outstanding ids are exactly the checklist item ids, in the same order', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            observables: [
              FlowObservableStub({ id: 'shows-form' }),
              FlowObservableStub({ id: 'focuses-username', type: 'ui-state' }),
            ],
          }),
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
          FlowNodeStub({ id: 'error-banner', label: 'Error Banner' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'login-to-dashboard',
            from: 'login-page',
            to: 'dashboard',
            label: 'success',
          }),
          FlowEdgeStub({
            id: 'login-to-error',
            from: 'login-page',
            to: 'error-banner',
            label: 'bad credentials',
          }),
          FlowEdgeStub({ id: 'plain-hop', from: 'dashboard', to: 'error-banner' }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest: QuestStub({ flows: [flow] }),
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }).map(String),
      ).toStrictEqual(qaChecklistBuildTransformer({ flow }).items.map((item) => String(item.id)));
    });
  });

  describe('the two tracks are independent', () => {
    it('VALID: {every unit signed by siegemaster only} => nothing outstanding for siegemaster, everything still outstanding for flowrider', () => {
      const signoff = SignoffStub();
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            observables: [FlowObservableStub({ id: 'shows-form', siegemasterSignoff: signoff })],
          }),
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard', siegemasterSignoff: signoff }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'login-to-dashboard',
            from: 'login-page',
            to: 'dashboard',
            label: 'success',
            siegemasterSignoff: signoff,
          }),
        ],
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: signoff }),
        ),
      });
      const quest = QuestStub({ flows: [flow] });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual([]);
      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual([
        'login-flow:terminal:dashboard',
        'login-flow:branch:login-to-dashboard',
        'login-flow:observable:shows-form',
      ]);
    });

    it('VALID: {every on-map unit signed by flowrider only} => nothing outstanding for flowrider, everything still outstanding for siegemaster', () => {
      const signoff = SignoffStub();
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'login-page',
            label: 'Login Page',
            observables: [FlowObservableStub({ id: 'shows-form', flowriderSignoff: signoff })],
          }),
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard', flowriderSignoff: signoff }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'login-to-dashboard',
            from: 'login-page',
            to: 'dashboard',
            label: 'success',
            flowriderSignoff: signoff,
          }),
        ],
      });
      const quest = QuestStub({ flows: [flow] });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual([]);
      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual([
        'login-flow:terminal:dashboard',
        'login-flow:branch:login-to-dashboard',
        'login-flow:observable:shows-form',
        ...OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      ]);
    });
  });

  describe('both verdicts clear a unit', () => {
    it("VALID: {verdict: 'confirmed'} => the unit clears", () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: SignoffStub({ verdict: 'confirmed' }),
              }),
            ],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual([]);
    });

    it("VALID: {verdict: 'unconfirmable' with a question} => the unit clears too, so the gate refuses absence rather than honesty", () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: SignoffStub({
                  verdict: 'unconfirmable',
                  evidence:
                    'jsdom reports every element 0x0, so the visibility assertion cannot be made at this layer',
                  question:
                    'Ran the suite under jsdom and under --env=node; both report zero geometry. Does this need a real browser (e2e) instead?',
                }),
              }),
            ],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual([]);
    });
  });

  describe('off-map units belong to siegemaster alone', () => {
    it('VALID: {a runtime flow with no on-map units, flowrider} => nothing outstanding, because off-map is not on this track', () => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] })],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {the same flow, siegemaster} => one off-map unit per family is outstanding', () => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] })],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual(OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`));
    });

    it('VALID: {one family signed by siegemaster, another by flowrider} => only the siegemaster-signed family clears', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [],
            edges: [],
            offMapSignoffs: [
              FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff: SignoffStub() }),
              FlowOffMapSignoffStub({ id: 'perf', flowriderSignoff: SignoffStub() }),
            ],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual(
        OFF_MAP_FAMILIES.filter((family) => family !== 'concurrency').map(
          (family) => `login-flow:off-map:${family}`,
        ),
      );
    });
  });

  describe('flowrider is gated on ROLE, never on flowIds', () => {
    it('VALID: {flowrider item declaring NO flowIds, a runtime flow on the quest} => still gated, and the runtime flow produces units', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider', flowIds: [] }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard']);
    });

    it('VALID: {flowrider item naming only ONE of two runtime flows} => both flows are still counted, because the denominator is the quest, not the item', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
          }),
          FlowStub({
            id: 'signup-flow',
            flowType: 'runtime',
            entryPoint: '/signup',
            nodes: [FlowNodeStub({ id: 'welcome', label: 'Welcome' })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard', 'signup-flow:terminal:welcome']);
    });

    it('EMPTY: {an ALL-OPERATIONAL quest, flowrider} => gated with zero units, because there is nothing walkable to prove — not because the gate was skipped', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'lint-rollout-flow',
            flowType: 'operational',
            entryPoint: 'repo root',
            nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule Registered' })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {one operational and one runtime flow, flowrider} => only the runtime flow contributes units', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'lint-rollout-flow',
            flowType: 'operational',
            entryPoint: 'repo root',
            nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule Registered' })],
            edges: [],
          }),
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard']);
    });

    it('VALID: {an operational flow scoped to a siegemaster item} => siegemaster covers it, so no flow is left unowned', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'lint-rollout-flow',
            flowType: 'operational',
            entryPoint: 'repo root',
            nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule Registered' })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'siegemaster',
            flowIds: ['lint-rollout-flow'],
          }),
        }),
      ).toStrictEqual([
        'lint-rollout-flow:terminal:rule-registered',
        ...OFF_MAP_FAMILIES.map((family) => `lint-rollout-flow:off-map:${family}`),
      ]);
    });
  });

  describe('provenance excludes what a track could never have signed', () => {
    it.each(FLOWRIDER_ELIGIBLE_ORIGINS)(
      'VALID: {observable addedBy: %s} => counted against flowrider, which ran no later than that origin',
      (origin) => {
        const quest = QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({
                  id: 'dashboard',
                  label: 'Dashboard',
                  flowriderSignoff: SignoffStub(),
                  observables: [FlowObservableStub({ id: 'shows-form', addedBy: origin })],
                }),
              ],
              edges: [],
            }),
          ],
        });

        expect(
          signoffOutstandingTransformer({
            quest,
            operationItem: OperationItemStub({ role: 'flowrider' }),
          }),
        ).toStrictEqual(['login-flow:observable:shows-form']);
      },
    );

    it.each(FLOWRIDER_EXCLUDED_ORIGINS)(
      'VALID: {observable addedBy: %s} => excluded from flowrider, because that role runs strictly after it and the hole could never be closed',
      (origin) => {
        const quest = QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({
                  id: 'dashboard',
                  label: 'Dashboard',
                  flowriderSignoff: SignoffStub(),
                  observables: [FlowObservableStub({ id: 'shows-form', addedBy: origin })],
                }),
              ],
              edges: [],
            }),
          ],
        });

        expect(
          signoffOutstandingTransformer({
            quest,
            operationItem: OperationItemStub({ role: 'flowrider' }),
          }),
        ).toStrictEqual([]);
      },
    );

    it.each(ALL_OBSERVABLE_ORIGINS)(
      'VALID: {observable addedBy: %s} => always counted against siegemaster, which runs last',
      (origin) => {
        const quest = QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({
                  id: 'dashboard',
                  label: 'Dashboard',
                  siegemasterSignoff: SignoffStub(),
                  observables: [FlowObservableStub({ id: 'shows-form', addedBy: origin })],
                }),
              ],
              edges: [],
              offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
                FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: SignoffStub() }),
              ),
            }),
          ],
        });

        expect(
          signoffOutstandingTransformer({
            quest,
            operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
          }),
        ).toStrictEqual(['login-flow:observable:shows-form']);
      },
    );

    it('VALID: {an observable with no addedBy on disk} => defaults to `spec` and is counted on the flowrider track', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                flowriderSignoff: SignoffStub(),
                observables: [FlowObservableStub({ id: 'shows-form' })],
              }),
            ],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual(['login-flow:observable:shows-form']);
    });
  });

  describe('siegemaster multi-flow scope', () => {
    it('VALID: {item covering two flows} => outstanding spans both, in quest-flow order', () => {
      const signoff = SignoffStub();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
            offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
              FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: signoff }),
            ),
          }),
          FlowStub({
            id: 'signup-flow',
            flowType: 'runtime',
            entryPoint: '/signup',
            nodes: [FlowNodeStub({ id: 'welcome', label: 'Welcome' })],
            edges: [],
            offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
              FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: signoff }),
            ),
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'siegemaster',
            flowIds: ['signup-flow', 'login-flow'],
          }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard', 'signup-flow:terminal:welcome']);
    });

    it("VALID: {only the other flow signed} => this item's flow stays outstanding", () => {
      const signoff = SignoffStub();
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
            edges: [],
            offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
              FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: signoff }),
            ),
          }),
          FlowStub({
            id: 'signup-flow',
            flowType: 'runtime',
            entryPoint: '/signup',
            nodes: [FlowNodeStub({ id: 'welcome', label: 'Welcome', siegemasterSignoff: signoff })],
            edges: [],
            offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
              FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: signoff }),
            ),
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard']);
    });
  });

  // The gate runs synchronously inside the signal-back responder on every `done` from these two
  // roles, so the numbers below are what it actually has to enumerate on a real quest: 281 units
  // across 7 flows.
  describe('scale — a real quest-sized spine', () => {
    it('VALID: {7 flows carrying 19 terminals, 85 branches and 128 observables} => siegemaster enumerates every on-map unit plus one off-map unit per family per flow, flowrider enumerates the on-map units alone, and signing a slice shrinks the set', () => {
      const flows = SCALE_TERMINALS_PER_FLOW.map((terminalCount, flowIndex) =>
        FlowStub({
          id: `flow-${String(flowIndex)}`,
          name: `Flow ${String(flowIndex)}`,
          flowType: 'runtime',
          entryPoint: `/flow-${String(flowIndex)}`,
          exitPoints: ['/done'],
          nodes: [
            FlowNodeStub({
              id: `flow-${String(flowIndex)}-entry`,
              label: `Flow ${String(flowIndex)} entry`,
              observables: Array.from(
                { length: SCALE_OBSERVABLES_PER_FLOW[flowIndex]! },
                (_unused, observableIndex) =>
                  FlowObservableStub({
                    id: `flow-${String(flowIndex)}-o-${String(observableIndex)}`,
                    description: `flow ${String(flowIndex)} observable ${String(observableIndex)}`,
                  }),
              ),
            }),
            ...Array.from({ length: terminalCount }, (_unused, terminalIndex) =>
              FlowNodeStub({
                id: `flow-${String(flowIndex)}-t-${String(terminalIndex)}`,
                label: `Flow ${String(flowIndex)} terminal ${String(terminalIndex)}`,
              }),
            ),
          ],
          edges: Array.from({ length: SCALE_BRANCHES_PER_FLOW[flowIndex]! }, (_unused, edgeIndex) =>
            FlowEdgeStub({
              id: `flow-${String(flowIndex)}-e-${String(edgeIndex)}`,
              from: `flow-${String(flowIndex)}-entry`,
              to: `flow-${String(flowIndex)}-t-${String(edgeIndex % terminalCount)}`,
              label: `branch ${String(edgeIndex)}`,
            }),
          ),
        }),
      );
      const quest = QuestStub({ flows });

      const expectedTerminals = SCALE_TERMINALS_PER_FLOW.reduce((sum, count) => sum + count, 0);
      const expectedBranches = SCALE_BRANCHES_PER_FLOW.reduce((sum, count) => sum + count, 0);
      const expectedObservables = SCALE_OBSERVABLES_PER_FLOW.reduce((sum, count) => sum + count, 0);
      // Derived from the family count, never written as 49 — an eighth probe family must move this
      // number rather than redden this test.
      const expectedOffMap = flows.length * OFF_MAP_FAMILY_COUNT;
      const expectedOnMap = expectedTerminals + expectedBranches + expectedObservables;

      const siegemasterIds = signoffOutstandingTransformer({
        quest,
        operationItem: OperationItemStub({
          role: 'siegemaster',
          flowIds: flows.map((flow) => String(flow.id)),
        }),
      }).map(String);
      const flowriderIds = signoffOutstandingTransformer({
        quest,
        operationItem: OperationItemStub({ role: 'flowrider' }),
      }).map(String);

      // The fixture IS the yardstick; pin its shape so a typo in the per-flow splits fails loudly
      // instead of quietly measuring a smaller quest.
      expect({
        flowCount: flows.length,
        terminals: expectedTerminals,
        branches: expectedBranches,
        observables: expectedObservables,
      }).toStrictEqual({ flowCount: 7, terminals: 19, branches: 85, observables: 128 });

      expect({
        terminals: siegemasterIds.filter((id) => id.split(':')[1] === 'terminal').length,
        branches: siegemasterIds.filter((id) => id.split(':')[1] === 'branch').length,
        observables: siegemasterIds.filter((id) => id.split(':')[1] === 'observable').length,
        offMap: siegemasterIds.filter((id) => id.split(':')[1] === 'off-map').length,
        total: siegemasterIds.length,
      }).toStrictEqual({
        terminals: expectedTerminals,
        branches: expectedBranches,
        observables: expectedObservables,
        offMap: expectedOffMap,
        total: expectedOnMap + expectedOffMap,
      });

      expect({
        offMap: flowriderIds.filter((id) => id.split(':')[1] === 'off-map').length,
        total: flowriderIds.length,
      }).toStrictEqual({ offMap: 0, total: expectedOnMap });

      // Grammar and ordering hold at scale, not just on the three-node fixtures above.
      expect(siegemasterIds.slice(0, 4)).toStrictEqual([
        'flow-0:terminal:flow-0-t-0',
        'flow-0:terminal:flow-0-t-1',
        'flow-0:terminal:flow-0-t-2',
        'flow-0:branch:flow-0-e-0',
      ]);

      // Signing one flow's off-map families removes exactly those units and nothing else — proof
      // the count above is a real enumeration rather than a constant.
      const signedFlowZeroOffMapIds = new Set(
        OFF_MAP_FAMILIES.map((family) => `flow-0:off-map:${family}`),
      );
      const partlySignedQuest = QuestStub({
        flows: flows.map((flow, flowIndex) =>
          FlowStub({
            ...flow,
            offMapSignoffs: OFF_MAP_FAMILIES.filter(() => flowIndex === 0).map((family) =>
              FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: SignoffStub() }),
            ),
          }),
        ),
      });

      expect(
        signoffOutstandingTransformer({
          quest: partlySignedQuest,
          operationItem: OperationItemStub({
            role: 'siegemaster',
            flowIds: flows.map((flow) => String(flow.id)),
          }),
        }).map(String),
      ).toStrictEqual(siegemasterIds.filter((id) => !signedFlowZeroOffMapIds.has(id)));
    });
  });
});
