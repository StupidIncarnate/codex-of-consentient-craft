import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { qaUnitEnumerateTransformer } from './qa-unit-enumerate-transformer';

// The off-map probe families every flow decomposes into. Derived from the probe statics, whose keys
// its own colocated test pins 1:1 with qaOffMapFamilyContract's options — a test file cannot import
// that contract, so this is the honest source for the list.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

describe('qaUnitEnumerateTransformer', () => {
  describe('terminal units', () => {
    it('VALID: {nodes with and without outgoing edges} => only the edgeless ones become terminal units', () => {
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({ id: 'login-page', label: 'Login Page' }),
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
        ],
        edges: [FlowEdgeStub({ id: 'login-to-dashboard', from: 'login-page', to: 'dashboard' })],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter((unit) => unit.kind === 'terminal'),
      ).toStrictEqual([
        {
          kind: 'terminal',
          id: 'login-flow:terminal:dashboard',
          flowId: 'login-flow',
          nodeId: 'dashboard',
          nodeLabel: 'Dashboard',
        },
      ]);
    });

    it("EDGE: {a node typed 'terminal' that still has an outgoing edge} => it is NOT a terminal unit; the node it points at is", () => {
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({ id: 'looks-terminal', label: 'Looks Terminal', type: 'terminal' }),
          FlowNodeStub({ id: 'really-last', label: 'Really Last', type: 'state' }),
        ],
        edges: [FlowEdgeStub({ id: 'onward', from: 'looks-terminal', to: 'really-last' })],
      });

      expect(
        qaUnitEnumerateTransformer({ flow })
          .filter((unit) => unit.kind === 'terminal')
          .map((unit) => String(unit.id)),
      ).toStrictEqual(['login-flow:terminal:really-last']);
    });

    it("VALID: {a signed terminal node} => the node's own two sign-offs ride onto the unit", () => {
      const flowriderSignoff = SignoffStub({ evidence: 'flowrider proved it' });
      const siegemasterSignoff = SignoffStub({ evidence: 'siegemaster walked it' });
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            flowriderSignoff,
            siegemasterSignoff,
          }),
        ],
        edges: [],
      });

      expect(qaUnitEnumerateTransformer({ flow })[0]).toStrictEqual({
        kind: 'terminal',
        id: 'login-flow:terminal:dashboard',
        flowId: 'login-flow',
        nodeId: 'dashboard',
        nodeLabel: 'Dashboard',
        flowriderSignoff,
        siegemasterSignoff,
      });
    });
  });

  describe('branch units', () => {
    it('VALID: {labelled and unlabelled edges} => only the labelled edge becomes a branch unit, carrying both endpoints', () => {
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({ id: 'decide-here', label: 'Valid?', type: 'decision' }),
          FlowNodeStub({ id: 'yes-end', label: 'Yes' }),
          FlowNodeStub({ id: 'no-end', label: 'No' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'decide-yes', from: 'decide-here', to: 'yes-end', label: 'valid' }),
          FlowEdgeStub({ id: 'decide-plain', from: 'decide-here', to: 'no-end' }),
        ],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter((unit) => unit.kind === 'branch'),
      ).toStrictEqual([
        {
          kind: 'branch',
          id: 'login-flow:branch:decide-yes',
          flowId: 'login-flow',
          edgeId: 'decide-yes',
          edgeFrom: 'decide-here',
          edgeLabel: 'valid',
          edgeTo: 'yes-end',
        },
      ]);
    });

    it("VALID: {a signed labelled edge} => the edge's own sign-off rides onto the branch unit", () => {
      const siegemasterSignoff = SignoffStub({ evidence: 'forced the rejection by hand' });
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({ id: 'login-page', label: 'Login Page' }),
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
        ],
        edges: [
          FlowEdgeStub({
            id: 'login-to-dashboard',
            from: 'login-page',
            to: 'dashboard',
            label: 'success',
            siegemasterSignoff,
          }),
        ],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter((unit) => unit.kind === 'branch'),
      ).toStrictEqual([
        {
          kind: 'branch',
          id: 'login-flow:branch:login-to-dashboard',
          flowId: 'login-flow',
          edgeId: 'login-to-dashboard',
          edgeFrom: 'login-page',
          edgeLabel: 'success',
          edgeTo: 'dashboard',
          siegemasterSignoff,
        },
      ]);
    });
  });

  describe('observable units', () => {
    it('VALID: {a node with two observables} => one unit each, carrying the description VERBATIM and the node it hangs off', () => {
      const flow = FlowStub({
        id: 'view-comments',
        nodes: [
          FlowNodeStub({
            id: 'render-badge',
            label: 'Box renders badge',
            type: 'action',
            observables: [
              FlowObservableStub({
                id: 'check-badge-count-text',
                type: 'ui-state',
                description: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
              }),
              FlowObservableStub({
                id: 'check-row-written',
                type: 'db-query',
                description: 'a comments row exists for the box',
              }),
            ],
          }),
        ],
        edges: [],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter((unit) => unit.kind === 'observable'),
      ).toStrictEqual([
        {
          kind: 'observable',
          id: 'view-comments:observable:check-badge-count-text',
          flowId: 'view-comments',
          nodeId: 'render-badge',
          observableId: 'check-badge-count-text',
          observableType: 'ui-state',
          observableDescription:
            'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
          addedBy: 'spec',
        },
        {
          kind: 'observable',
          id: 'view-comments:observable:check-row-written',
          flowId: 'view-comments',
          nodeId: 'render-badge',
          observableId: 'check-row-written',
          observableType: 'db-query',
          observableDescription: 'a comments row exists for the box',
          addedBy: 'spec',
        },
      ]);
    });

    it("VALID: {an observable added mid-quest by siegemaster} => its provenance rides onto the unit, because a track's denominator turns on it", () => {
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            observables: [FlowObservableStub({ id: 'shows-form', addedBy: 'siegemaster' })],
          }),
        ],
        edges: [],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter((unit) => unit.kind === 'observable'),
      ).toStrictEqual([
        {
          kind: 'observable',
          id: 'login-flow:observable:shows-form',
          flowId: 'login-flow',
          nodeId: 'dashboard',
          observableId: 'shows-form',
          observableType: 'ui-state',
          observableDescription: 'redirects to dashboard',
          addedBy: 'siegemaster',
        },
      ]);
    });

    it('EMPTY: {an observable with a blank description} => still emits a unit, so a spec hole never shrinks the definition of done', () => {
      const flow = FlowStub({
        id: 'login-flow',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            observables: [FlowObservableStub({ id: 'check-nothing', description: '' })],
          }),
        ],
        edges: [],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter((unit) => unit.kind === 'observable'),
      ).toStrictEqual([
        {
          kind: 'observable',
          id: 'login-flow:observable:check-nothing',
          flowId: 'login-flow',
          nodeId: 'dashboard',
          observableId: 'check-nothing',
          observableType: 'ui-state',
          observableDescription: '',
          addedBy: 'spec',
        },
      ]);
    });
  });

  describe('off-map units', () => {
    it('VALID: {any flow} => emits one unit per probe family, unconditionally', () => {
      const flow = FlowStub({ id: 'a-flow', nodes: [], edges: [] });

      expect(
        qaUnitEnumerateTransformer({ flow })
          .filter((unit) => unit.kind === 'off-map')
          .map((unit) => String(unit.id)),
      ).toStrictEqual(OFF_MAP_FAMILIES.map((family) => `a-flow:off-map:${family}`));
    });

    it("VALID: {a flow with one family signed} => that family's sign-off rides onto its own unit", () => {
      const siegemasterSignoff = SignoffStub({ evidence: 'double-submitted, it serialised' });
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [],
        edges: [],
        offMapSignoffs: [FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff })],
      });

      expect(
        qaUnitEnumerateTransformer({ flow }).filter(
          (unit) => String(unit.id) === 'a-flow:off-map:concurrency',
        ),
      ).toStrictEqual([
        {
          kind: 'off-map',
          id: 'a-flow:off-map:concurrency',
          flowId: 'a-flow',
          offMapFamily: 'concurrency',
          siegemasterSignoff,
        },
      ]);
    });

    it('VALID: {a flow with one family signed} => every other family stays unsigned', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [],
        edges: [],
        offMapSignoffs: [
          FlowOffMapSignoffStub({ id: 'concurrency', siegemasterSignoff: SignoffStub() }),
        ],
      });

      expect(
        qaUnitEnumerateTransformer({ flow })
          .filter((unit) => unit.siegemasterSignoff === undefined)
          .map((unit) => String(unit.id)),
      ).toStrictEqual(
        OFF_MAP_FAMILIES.filter((family) => family !== 'concurrency').map(
          (family) => `a-flow:off-map:${family}`,
        ),
      );
    });
  });

  describe('enumeration order and completeness', () => {
    it('VALID: {a flow with every kind} => units come back terminals, then branches, then observables, then off-map', () => {
      const flow = FlowStub({
        id: 'login-flow',
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
      });

      expect(qaUnitEnumerateTransformer({ flow }).map((unit) => String(unit.id))).toStrictEqual([
        'login-flow:terminal:dashboard',
        'login-flow:terminal:error-banner',
        'login-flow:branch:login-to-dashboard',
        'login-flow:branch:login-to-error',
        'login-flow:observable:shows-form',
        ...OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      ]);
    });

    it('EMPTY: {a flow with no nodes or edges} => only the off-map families are enumerated', () => {
      const flow = FlowStub({ id: 'a-flow', nodes: [], edges: [] });

      expect(qaUnitEnumerateTransformer({ flow }).map((unit) => unit.kind)).toStrictEqual(
        OFF_MAP_FAMILIES.map(() => 'off-map'),
      );
    });

    it('VALID: {the same flow enumerated twice} => produces byte-identical ids, so a later session resumes against what a predecessor landed', () => {
      const flow = FlowStub({
        id: 'a-flow',
        nodes: [
          FlowNodeStub({
            id: 'a-node',
            label: 'A node',
            observables: [FlowObservableStub({ id: 'check-thing', type: 'db-query' })],
          }),
        ],
        edges: [],
      });

      expect(qaUnitEnumerateTransformer({ flow }).map((unit) => String(unit.id))).toStrictEqual(
        qaUnitEnumerateTransformer({ flow }).map((unit) => String(unit.id)),
      );
    });
  });
});
