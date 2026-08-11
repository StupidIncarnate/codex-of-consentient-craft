import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemStub,
  QuestPackageEntryStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';
import {
  qaOffMapProbeStatics,
  questTypeRegistryStatics,
  workItemRoleStatics,
} from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { qaChecklistBuildTransformer } from '../qa-checklist-build/qa-checklist-build-transformer';
import { questSummaryBuildTransformer } from '../quest-summary-build/quest-summary-build-transformer';
import { relayTailFanOutTransformer } from '../relay-tail-fan-out/relay-tail-fan-out-transformer';
import { signoffOutstandingTransformer } from './signoff-outstanding-transformer';

// The off-map probe families every flow decomposes into. Derived from the probe statics, whose keys
// its own colocated test pins 1:1 with qaOffMapFamilyContract's options — `enforce-contract-usage-
// in-tests` rejects a `@dungeonmaster/shared/contracts` import whose specifiers are not all stubs,
// so a test file cannot read the contract's options and this is the honest source for the count.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);
const OFF_MAP_FAMILY_COUNT = OFF_MAP_FAMILIES.length;

// Every role the gate must NOT bind: the full role tuple minus the tracks the eligibility statics
// defines a denominator for. Both halves are derived, so a newly added role OR a newly added track
// is swept in automatically instead of being silently skipped by a hand-maintained list.
const GATED_ROLES = new Set(Object.keys(signoffTrackEligibilityStatics.byTrack));
const UNGATED_ROLES = workItemRoleStatics.names.filter((role) => !GATED_ROLES.has(role));

// The packages the package-kind fixtures below tag their nodes with, and the kind each resolves to
// through `quest.packagesAffected`. `ui-app` is browser-reachable and `api-service` is not, which is
// the whole axis that splits Groundstomper's denominator from Flowrider's.
const UI_PACKAGE = 'ui-app';
const API_PACKAGE = 'api-service';
const PACKAGES_AFFECTED = [
  QuestPackageEntryStub({
    name: UI_PACKAGE,
    location: `./packages/${UI_PACKAGE}`,
    changeType: 'edit',
    packageType: 'frontend-react',
  }),
  QuestPackageEntryStub({
    name: API_PACKAGE,
    location: `./packages/${API_PACKAGE}`,
    changeType: 'edit',
    packageType: 'http-backend',
  }),
];

// One runtime flow carrying every routing case at once: a UI terminal, a backend terminal, two
// branches leaving a GLUE node tagged with both packages, one branch leaving a backend-only DECISION
// node that carries NO observables at all, and a UI observable. Node order and edge order are what
// the enumerator's checklist order follows, so the expected id lists below read straight off it.
const PACKAGE_ROUTING_FLOW_NODES = [
  FlowNodeStub({
    id: 'login-form',
    label: 'Login form',
    packages: [UI_PACKAGE],
    observables: [FlowObservableStub({ id: 'shows-form' })],
  }),
  FlowNodeStub({
    id: 'submit-credentials',
    label: 'Submit credentials',
    type: 'decision',
    packages: [UI_PACKAGE, API_PACKAGE],
  }),
  FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [UI_PACKAGE] }),
  FlowNodeStub({ id: 'auth-error', label: 'Auth error', packages: [API_PACKAGE] }),
  FlowNodeStub({
    id: 'rate-limit-check',
    label: 'Rate limit check',
    type: 'decision',
    packages: [API_PACKAGE],
  }),
];
const PACKAGE_ROUTING_FLOW_EDGES = [
  FlowEdgeStub({ id: 'open-form', from: 'login-form', to: 'submit-credentials' }),
  FlowEdgeStub({
    id: 'submit-valid',
    from: 'submit-credentials',
    to: 'dashboard',
    label: 'credentials valid',
  }),
  FlowEdgeStub({
    id: 'submit-invalid',
    from: 'submit-credentials',
    to: 'auth-error',
    label: 'credentials invalid',
  }),
  FlowEdgeStub({ id: 'to-rate-limit', from: 'submit-credentials', to: 'rate-limit-check' }),
  FlowEdgeStub({
    id: 'rate-limited',
    from: 'rate-limit-check',
    to: 'auth-error',
    label: 'too many attempts',
  }),
];

// The two branches leaving the GLUE node. Its tags resolve to a browser-reachable kind AND a
// backend kind, so "at least one of the owning node's kinds is in this track's list" puts them in
// BOTH denominators — which costs nobody a second sign-off, because the two tracks write the same
// field and either one closing a seam unit closes it for the other.
const GLUE_UNITS = ['login-flow:branch:submit-valid', 'login-flow:branch:submit-invalid'];
// The browser-reachable slice: the UI terminal, the UI observable, and the seam.
const GROUNDSTOMPER_UNITS = [
  'login-flow:terminal:dashboard',
  ...GLUE_UNITS,
  'login-flow:observable:shows-form',
];
// Everything a browser cannot reach, plus the same seam: the backend terminal and the branch leaving
// the backend-only decision node — the node that carries no observables at all and would vanish
// from any observable-keyed slicer.
const FLOWRIDER_UNITS = [
  'login-flow:terminal:auth-error',
  ...GLUE_UNITS,
  'login-flow:branch:rate-limited',
];

// The Flowrider tail seed, read off the registry rather than restated, so the slices the partition
// test measures are the ones Start actually mints.
const FLOWRIDER_TAIL_ENTRY = questTypeRegistryStatics.feature.relayTail.filter(
  (entry) => entry.role === 'flowrider',
);

// A second fixture whose packages are BOTH kinds Flowrider measures, so the package-KIND narrowing
// is a no-op on it and the package-NAME slicing can be read on its own. `validate` is the glue node.
const BACKEND_PACKAGE = 'api-service';
const LIBRARY_PACKAGE = 'core-lib';
const BACKEND_PACKAGES_AFFECTED = [
  QuestPackageEntryStub({
    name: BACKEND_PACKAGE,
    location: `./packages/${BACKEND_PACKAGE}`,
    changeType: 'edit',
    packageType: 'http-backend',
  }),
  QuestPackageEntryStub({
    name: LIBRARY_PACKAGE,
    location: `./packages/${LIBRARY_PACKAGE}`,
    changeType: 'edit',
    packageType: 'library',
  }),
];
const SLICEABLE_FLOW = FlowStub({
  id: 'checkout-flow',
  flowType: 'runtime',
  entryPoint: '/checkout',
  nodes: [
    FlowNodeStub({
      id: 'intake',
      label: 'Intake',
      packages: [BACKEND_PACKAGE],
      observables: [FlowObservableStub({ id: 'accepts-order' })],
    }),
    FlowNodeStub({
      id: 'validate',
      label: 'Validate',
      type: 'decision',
      packages: [BACKEND_PACKAGE, LIBRARY_PACKAGE],
    }),
    FlowNodeStub({ id: 'priced', label: 'Priced', packages: [LIBRARY_PACKAGE] }),
    FlowNodeStub({ id: 'rejected', label: 'Rejected', packages: [BACKEND_PACKAGE] }),
  ],
  edges: [
    FlowEdgeStub({ id: 'to-validate', from: 'intake', to: 'validate' }),
    FlowEdgeStub({ id: 'valid', from: 'validate', to: 'priced', label: 'schema ok' }),
    FlowEdgeStub({ id: 'invalid', from: 'validate', to: 'rejected', label: 'schema bad' }),
  ],
});
// Every unit the whole-quest Flowrider denominator holds on that flow, in checklist order.
const SLICEABLE_FLOWRIDER_UNITS = [
  'checkout-flow:terminal:priced',
  'checkout-flow:terminal:rejected',
  'checkout-flow:branch:valid',
  'checkout-flow:branch:invalid',
  'checkout-flow:observable:accepts-order',
];

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
      'VALID: {role: %s} => returns nothing, because only a role the eligibility statics names a denominator for is gated here',
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

  describe('package-kind denominator — a unit routes by its owning NODE, never by its observable', () => {
    it('VALID: {groundstomper item} => owns the browser-reachable units alone, glue-node branches included', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: PACKAGE_ROUTING_FLOW_NODES,
            edges: PACKAGE_ROUTING_FLOW_EDGES,
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper' }),
        }),
      ).toStrictEqual(GROUNDSTOMPER_UNITS);
    });

    it('VALID: {flowrider item, the same flow} => owns the units no browser can reach, including the zero-observable decision node’s branch', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: PACKAGE_ROUTING_FLOW_NODES,
            edges: PACKAGE_ROUTING_FLOW_EDGES,
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      ).toStrictEqual(FLOWRIDER_UNITS);
    });

    it('VALID: {siegemaster item, the same flow} => owns every on-map unit both authoring tracks split, plus the off-map families', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: PACKAGE_ROUTING_FLOW_NODES,
            edges: PACKAGE_ROUTING_FLOW_EDGES,
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
        }).map(String),
      ).toStrictEqual([
        'login-flow:terminal:dashboard',
        'login-flow:terminal:auth-error',
        'login-flow:branch:submit-valid',
        'login-flow:branch:submit-invalid',
        'login-flow:branch:rate-limited',
        'login-flow:observable:shows-form',
        ...OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      ]);
    });

    it('VALID: {the two authoring items together} => they overlap on exactly the glue node’s units and cover every on-map unit between them, so nothing falls between the two tracks', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: PACKAGE_ROUTING_FLOW_NODES,
            edges: PACKAGE_ROUTING_FLOW_EDGES,
          }),
        ],
      });

      const groundstomperIds = signoffOutstandingTransformer({
        quest,
        operationItem: OperationItemStub({ role: 'groundstomper' }),
      }).map(String);
      const flowriderIds = signoffOutstandingTransformer({
        quest,
        operationItem: OperationItemStub({ role: 'flowrider' }),
      }).map(String);
      const siegemasterOnMapIds = signoffOutstandingTransformer({
        quest,
        operationItem: OperationItemStub({ role: 'siegemaster', flowIds: ['login-flow'] }),
      })
        .map(String)
        .filter((id) => id.split(':')[1] !== 'off-map');

      expect({
        shared: groundstomperIds.filter((id) => flowriderIds.includes(id)),
        union: [...new Set([...groundstomperIds, ...flowriderIds])].sort((left, right) =>
          left.localeCompare(right),
        ),
      }).toStrictEqual({
        shared: GLUE_UNITS,
        union: [...siegemasterOnMapIds].sort((left, right) => left.localeCompare(right)),
      });
    });

    it('VALID: {every browser-reachable unit carries a flowriderSignoff} => groundstomper clears and flowrider is left with only its own two, because the field is shared while the slice is not', () => {
      const signoff = SignoffStub();
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({
                id: 'login-form',
                label: 'Login form',
                packages: [UI_PACKAGE],
                observables: [FlowObservableStub({ id: 'shows-form', flowriderSignoff: signoff })],
              }),
              FlowNodeStub({
                id: 'submit-credentials',
                label: 'Submit credentials',
                type: 'decision',
                packages: [UI_PACKAGE, API_PACKAGE],
              }),
              FlowNodeStub({
                id: 'dashboard',
                label: 'Dashboard',
                packages: [UI_PACKAGE],
                flowriderSignoff: signoff,
              }),
              FlowNodeStub({ id: 'auth-error', label: 'Auth error', packages: [API_PACKAGE] }),
              FlowNodeStub({
                id: 'rate-limit-check',
                label: 'Rate limit check',
                type: 'decision',
                packages: [API_PACKAGE],
              }),
            ],
            edges: [
              FlowEdgeStub({ id: 'open-form', from: 'login-form', to: 'submit-credentials' }),
              FlowEdgeStub({
                id: 'submit-valid',
                from: 'submit-credentials',
                to: 'dashboard',
                label: 'credentials valid',
                flowriderSignoff: signoff,
              }),
              FlowEdgeStub({
                id: 'submit-invalid',
                from: 'submit-credentials',
                to: 'auth-error',
                label: 'credentials invalid',
                flowriderSignoff: signoff,
              }),
              FlowEdgeStub({
                id: 'to-rate-limit',
                from: 'submit-credentials',
                to: 'rate-limit-check',
              }),
              FlowEdgeStub({
                id: 'rate-limited',
                from: 'rate-limit-check',
                to: 'auth-error',
                label: 'too many attempts',
              }),
            ],
          }),
        ],
      });

      expect({
        groundstomper: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper' }),
        }),
        flowrider: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
        // The seam units the groundstomper session signed are gone from flowrider's list too — one
        // field, so closing a glue unit from the browser side closes it outright.
      }).toStrictEqual({
        groundstomper: [],
        flowrider: ['login-flow:terminal:auth-error', 'login-flow:branch:rate-limited'],
      });
    });

    it('VALID: {a node tagged with a package absent from packagesAffected} => counted for BOTH authoring tracks, because an unresolvable kind must never empty a denominator', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [
              FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: ['ghost-package'] }),
            ],
            edges: [],
          }),
        ],
      });

      expect({
        groundstomper: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper' }),
        }),
        flowrider: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      }).toStrictEqual({
        groundstomper: ['login-flow:terminal:dashboard'],
        flowrider: ['login-flow:terminal:dashboard'],
      });
    });

    it('EMPTY: {a quest declaring no packagesAffected at all} => no unit is narrowed away, so the gate stays bound on untagged data', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: PACKAGE_ROUTING_FLOW_NODES,
            edges: PACKAGE_ROUTING_FLOW_EDGES,
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper' }),
        }).map(String),
      ).toStrictEqual([
        'login-flow:terminal:dashboard',
        'login-flow:terminal:auth-error',
        'login-flow:branch:submit-valid',
        'login-flow:branch:submit-invalid',
        'login-flow:branch:rate-limited',
        'login-flow:observable:shows-form',
      ]);
    });

    it('EMPTY: {groundstomper item, an ALL-OPERATIONAL quest} => gated with zero units, because it inherits the runtime-only exclusion', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'lint-rollout-flow',
            flowType: 'operational',
            entryPoint: 'repo root',
            nodes: [
              FlowNodeStub({
                id: 'rule-registered',
                label: 'Rule Registered',
                packages: [UI_PACKAGE],
              }),
            ],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper' }),
        }),
      ).toStrictEqual([]);
    });

    it('VALID: {groundstomper item declaring only ONE of two runtime flows} => both are still counted, because the denominator is the quest and not the item', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [UI_PACKAGE] })],
            edges: [],
          }),
          FlowStub({
            id: 'signup-flow',
            flowType: 'runtime',
            entryPoint: '/signup',
            nodes: [FlowNodeStub({ id: 'welcome', label: 'Welcome', packages: [UI_PACKAGE] })],
            edges: [],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper', flowIds: ['login-flow'] }),
        }),
      ).toStrictEqual(['login-flow:terminal:dashboard', 'signup-flow:terminal:welcome']);
    });

    it('EDGE: {a labelled edge leaving a node the flow does not carry} => its branch stays in every denominator, because a node that cannot be found resolves to no kind at all', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [API_PACKAGE] })],
            edges: [
              FlowEdgeStub({
                id: 'orphan-branch',
                from: 'node-that-was-deleted',
                to: 'dashboard',
                label: 'session valid',
              }),
            ],
          }),
        ],
      });

      expect({
        groundstomper: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'groundstomper' }),
        }),
        flowrider: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider' }),
        }),
      }).toStrictEqual({
        groundstomper: ['login-flow:branch:orphan-branch'],
        flowrider: ['login-flow:terminal:dashboard', 'login-flow:branch:orphan-branch'],
      });
    });

    it("VALID: {siegemaster item, every node tagged backend-only} => the off-map families still stand, because they hang off no node and are nobody's package", () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [API_PACKAGE] })],
            edges: [],
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
        ...OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      ]);
    });
  });

  describe('package-NAME denominator — the item’s own slice, not the whole quest’s', () => {
    it('VALID: {the slices Start actually mints} => they PARTITION the whole-quest denominator: every unit owned once, none owned twice, none dropped', () => {
      const quest = QuestStub({
        packagesAffected: BACKEND_PACKAGES_AFFECTED,
        flows: [SLICEABLE_FLOW],
      });

      const slices = relayTailFanOutTransformer({ entry: FLOWRIDER_TAIL_ENTRY[0]!, quest });
      const perSliceIds = slices.map((slice) =>
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'flowrider',
            flowIds: slice.flowIds.map(String),
            packageNames: slice.packageNames.map(String),
          }),
        }).map(String),
      );
      const everyOwnedId = perSliceIds.flat();
      const wholeQuestIds = signoffOutstandingTransformer({
        quest,
        operationItem: OperationItemStub({ role: 'flowrider' }),
      }).map(String);

      expect({
        sliceScopes: slices.map((slice) => slice.packageNames.map(String)),
        perSliceIds,
        ownedOnce: [...everyOwnedId].sort((left, right) => left.localeCompare(right)),
        duplicates: everyOwnedId.filter((id, index) => everyOwnedId.indexOf(id) !== index),
        wholeQuest: [...wholeQuestIds].sort((left, right) => left.localeCompare(right)),
      }).toStrictEqual({
        sliceScopes: [[BACKEND_PACKAGE], [LIBRARY_PACKAGE], [BACKEND_PACKAGE, LIBRARY_PACKAGE]],
        perSliceIds: [
          ['checkout-flow:terminal:rejected', 'checkout-flow:observable:accepts-order'],
          ['checkout-flow:terminal:priced'],
          ['checkout-flow:branch:valid', 'checkout-flow:branch:invalid'],
        ],
        ownedOnce: [...SLICEABLE_FLOWRIDER_UNITS].sort((left, right) => left.localeCompare(right)),
        duplicates: [],
        wholeQuest: [...SLICEABLE_FLOWRIDER_UNITS].sort((left, right) => left.localeCompare(right)),
      });
    });

    it('VALID: {a per-package item, its OWN unit unsigned} => refused, so the slice still binds', () => {
      const signoff = SignoffStub();
      const quest = QuestStub({
        packagesAffected: BACKEND_PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            ...SLICEABLE_FLOW,
            nodes: [
              FlowNodeStub({
                id: 'intake',
                label: 'Intake',
                packages: [BACKEND_PACKAGE],
                observables: [
                  FlowObservableStub({ id: 'accepts-order', flowriderSignoff: signoff }),
                ],
              }),
              FlowNodeStub({
                id: 'validate',
                label: 'Validate',
                type: 'decision',
                packages: [BACKEND_PACKAGE, LIBRARY_PACKAGE],
              }),
              FlowNodeStub({
                id: 'priced',
                label: 'Priced',
                packages: [LIBRARY_PACKAGE],
                flowriderSignoff: signoff,
              }),
              FlowNodeStub({ id: 'rejected', label: 'Rejected', packages: [BACKEND_PACKAGE] }),
            ],
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'flowrider',
            packageNames: [BACKEND_PACKAGE],
          }),
        }),
      ).toStrictEqual(['checkout-flow:terminal:rejected']);
    });

    it("VALID: {the SAME item, another package's unit unsigned} => cleared, because one package's remainder is not this item's scope", () => {
      const signoff = SignoffStub();
      const quest = QuestStub({
        packagesAffected: BACKEND_PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            ...SLICEABLE_FLOW,
            nodes: [
              FlowNodeStub({
                id: 'intake',
                label: 'Intake',
                packages: [BACKEND_PACKAGE],
                observables: [
                  FlowObservableStub({ id: 'accepts-order', flowriderSignoff: signoff }),
                ],
              }),
              FlowNodeStub({
                id: 'validate',
                label: 'Validate',
                type: 'decision',
                packages: [BACKEND_PACKAGE, LIBRARY_PACKAGE],
              }),
              FlowNodeStub({ id: 'priced', label: 'Priced', packages: [LIBRARY_PACKAGE] }),
              FlowNodeStub({
                id: 'rejected',
                label: 'Rejected',
                packages: [BACKEND_PACKAGE],
                flowriderSignoff: signoff,
              }),
            ],
          }),
        ],
      });

      expect({
        backend: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'flowrider',
            packageNames: [BACKEND_PACKAGE],
          }),
        }),
        library: signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'flowrider',
            packageNames: [LIBRARY_PACKAGE],
          }),
        }),
      }).toStrictEqual({
        backend: [],
        library: ['checkout-flow:terminal:priced'],
      });
    });

    it('VALID: {the SEAM item} => owns the glue node’s branches alone, and no single-tagged unit at all', () => {
      const quest = QuestStub({
        packagesAffected: BACKEND_PACKAGES_AFFECTED,
        flows: [SLICEABLE_FLOW],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'flowrider',
            packageNames: [BACKEND_PACKAGE, LIBRARY_PACKAGE],
          }),
        }),
      ).toStrictEqual(['checkout-flow:branch:valid', 'checkout-flow:branch:invalid']);
    });

    it('EMPTY: {an item declaring NO packageNames} => the whole-quest denominator, unchanged', () => {
      const quest = QuestStub({
        packagesAffected: BACKEND_PACKAGES_AFFECTED,
        flows: [SLICEABLE_FLOW],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({ role: 'flowrider', packageNames: [] }),
        }).map(String),
      ).toStrictEqual(SLICEABLE_FLOWRIDER_UNITS);
    });

    it('VALID: {a groundstomper item declaring one package} => keeps the glue units, because its items partition FLOWS and no seam item exists to catch them', () => {
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [
          FlowStub({
            id: 'login-flow',
            flowType: 'runtime',
            nodes: PACKAGE_ROUTING_FLOW_NODES,
            edges: PACKAGE_ROUTING_FLOW_EDGES,
          }),
        ],
      });

      expect(
        signoffOutstandingTransformer({
          quest,
          operationItem: OperationItemStub({
            role: 'groundstomper',
            flowIds: ['login-flow'],
            packageNames: [UI_PACKAGE],
          }),
        }),
      ).toStrictEqual(GROUNDSTOMPER_UNITS);
    });
  });

  describe('the gate, the checklist and the summary quote ONE number', () => {
    it.each([
      {
        scope: [BACKEND_PACKAGE],
        expected: ['checkout-flow:terminal:rejected', 'checkout-flow:observable:accepts-order'],
      },
      { scope: [LIBRARY_PACKAGE], expected: ['checkout-flow:terminal:priced'] },
      {
        scope: [BACKEND_PACKAGE, LIBRARY_PACKAGE],
        expected: ['checkout-flow:branch:valid', 'checkout-flow:branch:invalid'],
      },
      { scope: [], expected: SLICEABLE_FLOWRIDER_UNITS },
    ])(
      'VALID: {a flowrider item scoped to $scope} => the completion gate, get-qa-checklist and get-quest-summary report the same remainder',
      ({ scope, expected }) => {
        const quest = QuestStub({
          packagesAffected: BACKEND_PACKAGES_AFFECTED,
          flows: [SLICEABLE_FLOW],
        });
        const operationItem = OperationItemStub({ role: 'flowrider', packageNames: scope });

        expect({
          gate: signoffOutstandingTransformer({ quest, operationItem }).map(String),
          checklist: qaChecklistBuildTransformer({
            flow: SLICEABLE_FLOW,
            track: 'flowrider',
            packagesAffected: quest.packagesAffected,
            packageNames: operationItem.packageNames,
          }).remainingItemIds.map(String),
          summaryOutstanding: questSummaryBuildTransformer({
            quest,
            packageNames: operationItem.packageNames,
          }).flows.flatMap((flowRow) =>
            flowRow.tracks
              .filter((trackRow) => trackRow.id === 'flowrider')
              .map((trackRow) => Number(trackRow.outstanding)),
          ),
        }).toStrictEqual({
          gate: expected,
          checklist: expected,
          summaryOutstanding: [expected.length],
        });
      },
    );
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
