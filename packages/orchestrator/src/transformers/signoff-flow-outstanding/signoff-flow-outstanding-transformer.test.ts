import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { signoffFlowOutstandingTransformer } from './signoff-flow-outstanding-transformer';

// The off-map probe families every flow decomposes into. Derived from the probe statics, whose
// colocated test pins its keys 1:1 with qaOffMapFamilyContract's options — a test file cannot import
// the contract itself (enforce-contract-usage-in-tests allows stubs only), so this is the honest
// source for the family list.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);

// The observable origins each track could ever have signed, straight off the statics the transformer
// reads, split into the two halves Flowrider treats differently.
const ALL_OBSERVABLE_ORIGINS = signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins;
const FLOWRIDER_ELIGIBLE_SET = new Set(
  signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins.map(String),
);
const FLOWRIDER_EXCLUDED_ORIGINS = ALL_OBSERVABLE_ORIGINS.filter(
  (origin) => !FLOWRIDER_ELIGIBLE_SET.has(origin),
);

describe('signoffFlowOutstandingTransformer', () => {
  describe('unsigned units', () => {
    it('VALID: {flowrider, one terminal, no sign-offs} => the terminal is outstanding and off-map is not', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
        edges: [],
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([
        'login-flow:terminal:dashboard',
      ]);
    });

    it('VALID: {siegemaster, one terminal, no sign-offs} => the terminal AND every off-map family are outstanding', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
        edges: [],
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'siegemaster' })).toStrictEqual([
        'login-flow:terminal:dashboard',
        ...OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      ]);
    });

    it('VALID: {labelled edge, no sign-offs} => the branch is outstanding on both tracks', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({ id: 'form', label: 'Login form' }),
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
        ],
        edges: [
          FlowEdgeStub({ id: 'form-to-dashboard', from: 'form', to: 'dashboard', label: 'valid' }),
        ],
      });

      expect({
        flowrider: signoffFlowOutstandingTransformer({ flow, track: 'flowrider' }),
        siegemaster: signoffFlowOutstandingTransformer({ flow, track: 'siegemaster' }).slice(0, 2),
      }).toStrictEqual({
        flowrider: ['login-flow:terminal:dashboard', 'login-flow:branch:form-to-dashboard'],
        siegemaster: ['login-flow:terminal:dashboard', 'login-flow:branch:form-to-dashboard'],
      });
    });
  });

  describe('a sign-off on the track clears its unit', () => {
    it('VALID: {terminal carries flowriderSignoff} => outstanding for siegemaster only', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard', flowriderSignoff: SignoffStub() }),
        ],
        edges: [],
      });

      expect({
        flowrider: signoffFlowOutstandingTransformer({ flow, track: 'flowrider' }),
        siegemaster: signoffFlowOutstandingTransformer({ flow, track: 'siegemaster' }).slice(0, 1),
      }).toStrictEqual({
        flowrider: [],
        siegemaster: ['login-flow:terminal:dashboard'],
      });
    });

    it('VALID: {terminal carries an `unconfirmable` flowriderSignoff} => cleared just like `confirmed`', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            flowriderSignoff: SignoffStub({
              verdict: 'unconfirmable',
              evidence: 'the dashboard route 500s under jsdom before any assertion can run',
              question: 'does the dashboard need a real browser to render at all?',
            }),
          }),
        ],
        edges: [],
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([]);
    });

    it('VALID: {every off-map family carries siegemasterSignoff} => siegemaster is left with only the terminal', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
        edges: [],
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: SignoffStub() }),
        ),
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'siegemaster' })).toStrictEqual([
        'login-flow:terminal:dashboard',
      ]);
    });
  });

  describe('observable provenance excluded from the flowrider denominator', () => {
    it.each(FLOWRIDER_EXCLUDED_ORIGINS)(
      'VALID: {observable addedBy: %s} => never outstanding for flowrider, because flowrider ran before it existed',
      (addedBy) => {
        const flow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              flowriderSignoff: SignoffStub(),
              observables: [FlowObservableStub({ id: 'late-observable', addedBy })],
            }),
          ],
          edges: [],
        });

        expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([]);
      },
    );

    it.each(signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins)(
      'VALID: {observable addedBy: %s} => outstanding for flowrider, because flowrider could have signed it',
      (addedBy) => {
        const flow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              flowriderSignoff: SignoffStub(),
              observables: [FlowObservableStub({ id: 'an-observable', addedBy })],
            }),
          ],
          edges: [],
        });

        expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([
          'login-flow:observable:an-observable',
        ]);
      },
    );
  });

  describe('nothing to measure', () => {
    it('EMPTY: {node-less, edge-less flow} => flowrider has zero units, because off-map is not its charter', () => {
      const flow = FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([]);
    });

    it('EMPTY: {node-less, edge-less flow} => siegemaster still owns every off-map family', () => {
      const flow = FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'siegemaster' })).toStrictEqual(
        OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      );
    });
  });
});
