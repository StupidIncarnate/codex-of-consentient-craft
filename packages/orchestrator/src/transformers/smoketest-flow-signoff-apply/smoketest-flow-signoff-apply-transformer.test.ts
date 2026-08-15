import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  QaChecklistItemIdStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { smoketestFlowSignoffApplyTransformer } from './smoketest-flow-signoff-apply-transformer';

type OffMapFamily = keyof typeof qaOffMapProbeStatics.byFamily;

// Derived from the two eligibility entries rather than typed as literals: the map from track to
// field is many-to-one and lives in one place, so reading it here is what keeps this test honest the
// day a track's field changes.
const SIEGEMASTER_FIELD = signoffTrackEligibilityStatics.byTrack.siegemaster.signoffField;
const FLOWRIDER_FIELD = signoffTrackEligibilityStatics.byTrack.flowrider.signoffField;

// The seven off-map families, in the order the enumerator emits them. Read off the probe statics,
// whose colocated test pins its keys 1:1 with the contract's options — a test file cannot import
// that contract, so this is the honest source.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily) as readonly OffMapFamily[];

const SIGNOFF = SignoffStub({ evidence: 'fixture evidence, written by the harness' });

// One flow carrying every unit kind: two terminals (nothing leaves them), two labelled branches
// leaving the entry node, and one observable embedded in that entry node.
const FLOW = FlowStub({
  id: 'login-flow',
  nodes: [
    FlowNodeStub({
      id: 'login-form',
      label: 'Login form',
      type: 'decision',
      observables: [FlowObservableStub({ id: 'shows-form' })],
    }),
    FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
    FlowNodeStub({ id: 'auth-error', label: 'Auth error' }),
  ],
  edges: [
    FlowEdgeStub({
      id: 'submit-valid',
      from: 'login-form',
      to: 'dashboard',
      label: 'credentials valid',
    }),
    FlowEdgeStub({
      id: 'submit-invalid',
      from: 'login-form',
      to: 'auth-error',
      label: 'credentials invalid',
    }),
  ],
});

describe('smoketestFlowSignoffApplyTransformer', () => {
  describe('terminal units', () => {
    it('VALID: {one terminal id} => that node carries the sign-off and the sibling terminal does not', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:terminal:dashboard' })],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect(
        result.nodes.map((node) => ({
          id: String(node.id),
          signoff: node[SIEGEMASTER_FIELD],
        })),
      ).toStrictEqual([
        { id: 'login-form', signoff: undefined },
        { id: 'dashboard', signoff: SIGNOFF },
        { id: 'auth-error', signoff: undefined },
      ]);
    });
  });

  describe('branch units', () => {
    it('VALID: {one branch id} => that edge carries the sign-off and the sibling branch does not', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:branch:submit-invalid' })],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect(
        result.edges.map((edge) => ({
          id: String(edge.id),
          signoff: edge[SIEGEMASTER_FIELD],
        })),
      ).toStrictEqual([
        { id: 'submit-valid', signoff: undefined },
        { id: 'submit-invalid', signoff: SIGNOFF },
      ]);
    });
  });

  describe('observable units', () => {
    it('VALID: {one observable id} => the embedded observable carries the sign-off and its owning node does not', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:observable:shows-form' })],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect({
        owningNodeSignoff: result.nodes.map((node) => node[SIEGEMASTER_FIELD]),
        observableSignoffs: result.nodes.flatMap((node) =>
          node.observables.map((observable) => ({
            id: String(observable.id),
            signoff: observable[SIEGEMASTER_FIELD],
          })),
        ),
      }).toStrictEqual({
        owningNodeSignoff: [undefined, undefined, undefined],
        observableSignoffs: [{ id: 'shows-form', signoff: SIGNOFF }],
      });
    });
  });

  describe('off-map units', () => {
    it('VALID: {every off-map family, none recorded} => appends one entry per family in enumeration order', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: OFF_MAP_FAMILIES.map((family) =>
          QaChecklistItemIdStub({ value: `login-flow:off-map:${family}` }),
        ),
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect(result.offMapSignoffs).toStrictEqual(
        OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({ id: family, siegemasterSignoff: SIGNOFF }),
        ),
      );
    });

    it('VALID: {family already recorded on the other track} => upserts that entry instead of appending a duplicate', () => {
      const alreadyRecorded = FlowOffMapSignoffStub({
        id: 'concurrency',
        flowriderSignoff: SIGNOFF,
      });
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FlowStub({ ...FLOW, offMapSignoffs: [alreadyRecorded] }),
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:off-map:concurrency' })],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect(result.offMapSignoffs).toStrictEqual([
        FlowOffMapSignoffStub({
          id: 'concurrency',
          flowriderSignoff: SIGNOFF,
          siegemasterSignoff: SIGNOFF,
        }),
      ]);
    });
  });

  describe('track independence', () => {
    it('VALID: {siegemaster field} => the flowrider field on the same unit stays absent', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:terminal:dashboard' })],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect(
        result.nodes.map((node) => ({
          id: String(node.id),
          flowrider: node[FLOWRIDER_FIELD],
          siegemaster: node[SIEGEMASTER_FIELD],
        })),
      ).toStrictEqual([
        { id: 'login-form', flowrider: undefined, siegemaster: undefined },
        { id: 'dashboard', flowrider: undefined, siegemaster: SIGNOFF },
        { id: 'auth-error', flowrider: undefined, siegemaster: undefined },
      ]);
    });

    it('VALID: {flowrider field on a branch} => that edge carries flowriderSignoff alone', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:branch:submit-valid' })],
        signoffField: FLOWRIDER_FIELD,
        signoff: SIGNOFF,
      });

      expect(
        result.edges.map((edge) => ({
          id: String(edge.id),
          flowrider: edge[FLOWRIDER_FIELD],
          siegemaster: edge[SIEGEMASTER_FIELD],
        })),
      ).toStrictEqual([
        { id: 'submit-valid', flowrider: SIGNOFF, siegemaster: undefined },
        { id: 'submit-invalid', flowrider: undefined, siegemaster: undefined },
      ]);
    });
  });

  describe('ids that name nothing', () => {
    it('EMPTY: {unitIds: []} => no unit on the flow carries a sign-off', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect({
        nodes: result.nodes.map((node) => node[SIEGEMASTER_FIELD]),
        edges: result.edges.map((edge) => edge[SIEGEMASTER_FIELD]),
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        nodes: [undefined, undefined, undefined],
        edges: [undefined, undefined],
        offMapSignoffs: [],
      });
    });

    it('INVALID: {id the enumeration never mints} => nothing is signed', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:terminal:no-such-node' })],
        signoffField: SIEGEMASTER_FIELD,
        signoff: SIGNOFF,
      });

      expect({
        nodes: result.nodes.map((node) => node[SIEGEMASTER_FIELD]),
        edges: result.edges.map((edge) => edge[SIEGEMASTER_FIELD]),
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        nodes: [undefined, undefined, undefined],
        edges: [undefined, undefined],
        offMapSignoffs: [],
      });
    });
  });
});
