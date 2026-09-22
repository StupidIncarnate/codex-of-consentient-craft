import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  QaChecklistItemIdStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { smoketestFlowSignoffApplyTransformer } from './smoketest-flow-signoff-apply-transformer';

type OffMapFamily = keyof typeof qaOffMapProbeStatics.byFamily;

// The seven off-map families, in the order the enumerator emits them. Read off the probe statics,
// whose colocated test pins its keys 1:1 with the contract's options — a test file cannot import
// that contract, so this is the honest source.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily) as readonly OffMapFamily[];

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
    it('VALID: {one terminal id} => nodes are preserved without sign-off fields and offMapSignoffs is untouched', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:terminal:dashboard' })],
      });

      expect({
        nodes: result.nodes,
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        nodes: FLOW.nodes,
        offMapSignoffs: [],
      });
    });
  });

  describe('branch units', () => {
    it('VALID: {one branch id} => edges are preserved without sign-off fields and offMapSignoffs is untouched', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:branch:submit-invalid' })],
      });

      expect({
        edges: result.edges,
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        edges: FLOW.edges,
        offMapSignoffs: [],
      });
    });
  });

  describe('observable units', () => {
    it('VALID: {one observable id} => observables are preserved without sign-off fields and offMapSignoffs is untouched', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:observable:shows-form' })],
      });

      expect({
        nodes: result.nodes,
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        nodes: FLOW.nodes,
        offMapSignoffs: [],
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
      });

      expect(result.offMapSignoffs).toStrictEqual(
        OFF_MAP_FAMILIES.map((family) => FlowOffMapSignoffStub({ id: family })),
      );
    });

    it('VALID: {family already recorded} => preserves that entry instead of appending a duplicate', () => {
      const alreadyRecorded = FlowOffMapSignoffStub({
        id: 'concurrency',
      });
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FlowStub({ ...FLOW, offMapSignoffs: [alreadyRecorded] }),
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:off-map:concurrency' })],
      });

      expect(result.offMapSignoffs).toStrictEqual([FlowOffMapSignoffStub({ id: 'concurrency' })]);
    });
  });

  describe('ids that name nothing', () => {
    it('EMPTY: {unitIds: []} => returns flow with untouched offMapSignoffs', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [],
      });

      expect({
        nodes: result.nodes,
        edges: result.edges,
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        nodes: FLOW.nodes,
        edges: FLOW.edges,
        offMapSignoffs: [],
      });
    });

    it('INVALID: {id the enumeration never mints} => nothing is added', () => {
      const result = smoketestFlowSignoffApplyTransformer({
        flow: FLOW,
        unitIds: [QaChecklistItemIdStub({ value: 'login-flow:terminal:no-such-node' })],
      });

      expect({
        nodes: result.nodes,
        edges: result.edges,
        offMapSignoffs: result.offMapSignoffs,
      }).toStrictEqual({
        nodes: FLOW.nodes,
        edges: FLOW.edges,
        offMapSignoffs: [],
      });
    });
  });
});
