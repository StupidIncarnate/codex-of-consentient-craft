import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';
import { qaOffMapProbeStatics, textDisplaySymbolsStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from '../../statics/signoff-track-eligibility/signoff-track-eligibility-statics';
import { signoffFlowOutstandingTransformer } from './signoff-flow-outstanding-transformer';

type SignoffTrack = keyof typeof signoffTrackEligibilityStatics.byTrack;
type SignoffVerdict = ReturnType<typeof SignoffStub>['verdict'];

// Every denominator this transformer can be asked for, straight off the statics it reads — a fourth
// track lands in these matrices automatically instead of being silently skipped.
const TRACKS = Object.keys(signoffTrackEligibilityStatics.byTrack) as SignoffTrack[];

// The verdicts a sign-off can carry. `textDisplaySymbolsStatics.signoffVerdictMarks` is keyed 1:1
// with signoffVerdictContract's options and its colocated test pins that, so it is the honest source
// a test file can reach (enforce-contract-usage-in-tests allows stubs only).
const SIGNOFF_VERDICTS = Object.keys(
  textDisplaySymbolsStatics.signoffVerdictMarks,
) as SignoffVerdict[];

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

// The tracks that do NOT carry `reading`, read off the same statics rather than named here — a track
// that later grows the ability to settle a read-check drops out of this list on its own instead of
// leaving a test asserting an exclusion the statics no longer make.
const READ_CHECK_EXCLUDED_TRACKS = TRACKS.filter(
  (track) =>
    !new Set(signoffTrackEligibilityStatics.byTrack[track].verificationMethods.map(String)).has(
      'reading',
    ),
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
              toSettle: 'Render the dashboard in a real browser and read what paints.',
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

  describe('a read-check observable is only codeweaver’s to settle', () => {
    it('VALID: {verifyByReading: true} => outstanding for codeweaver, whose reviewer opens the file', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            codeweaverSignoff: SignoffStub(),
            observables: [
              FlowObservableStub({
                id: 'pattern-not-inlined',
                type: 'custom',
                verifyByReading: true,
              }),
            ],
          }),
        ],
        edges: [],
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'codeweaver' })).toStrictEqual([
        'login-flow:observable:pattern-not-inlined',
      ]);
    });

    it.each(READ_CHECK_EXCLUDED_TRACKS)(
      'VALID: {verifyByReading: true, track: %s} => outside the denominator, because that track runs tests and drives a system rather than reading source',
      (track) => {
        const flow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              codeweaverSignoff: SignoffStub(),
              flowriderSignoff: SignoffStub(),
              siegemasterSignoff: SignoffStub(),
              observables: [
                FlowObservableStub({
                  id: 'pattern-not-inlined',
                  type: 'custom',
                  verifyByReading: true,
                }),
              ],
            }),
          ],
          edges: [],
        });

        expect(
          signoffFlowOutstandingTransformer({ flow, track }).filter(
            (id) => String(id) === 'login-flow:observable:pattern-not-inlined',
          ),
        ).toStrictEqual([]);
      },
    );

    it.each(TRACKS)(
      'VALID: {verifyByReading absent, track: %s} => outstanding on every track, so the flag is what narrows and not the type',
      (track) => {
        const flow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              codeweaverSignoff: SignoffStub(),
              flowriderSignoff: SignoffStub(),
              siegemasterSignoff: SignoffStub(),
              observables: [FlowObservableStub({ id: 'pattern-not-inlined', type: 'custom' })],
            }),
          ],
          edges: [],
        });

        expect(
          signoffFlowOutstandingTransformer({ flow, track }).filter(
            (id) => String(id) === 'login-flow:observable:pattern-not-inlined',
          ),
        ).toStrictEqual(['login-flow:observable:pattern-not-inlined']);
      },
    );
  });

  describe('the sign-off FIELD each track is measured against', () => {
    it.each(TRACKS)(
      'VALID: {track: %s, one unsigned terminal} => the terminal is outstanding, so every denominator binds on it',
      (track) => {
        const flow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
          edges: [],
        });
        // Off-map is Siegemaster's charter alone, so the tail is present exactly for the tracks
        // whose own unitKinds list names it — derived, never a per-track literal.
        const expectedOffMap = signoffTrackEligibilityStatics.byTrack[track].unitKinds
          .filter((kind) => kind === 'off-map')
          .flatMap(() => OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`));

        expect(signoffFlowOutstandingTransformer({ flow, track })).toStrictEqual([
          'login-flow:terminal:dashboard',
          ...expectedOffMap,
        ]);
      },
    );

    it('VALID: {flowrider, terminal carries siegemasterSignoff only} => still outstanding, because the other field never settles it', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard', siegemasterSignoff: SignoffStub() }),
        ],
        edges: [],
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([
        'login-flow:terminal:dashboard',
      ]);
    });

    it.each(SIGNOFF_VERDICTS)(
      'VALID: {flowrider, flowriderSignoff verdict: %s} => cleared, because the gate refuses ABSENCE and not honesty',
      (verdict) => {
        const flow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              flowriderSignoff: SignoffStub({
                verdict,
                evidence: 'the walk stops at the dashboard route, which never renders',
                toSettle: 'Seed a session, then render the dashboard and read what paints.',
              }),
            }),
          ],
          edges: [],
        });

        expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([]);
      },
    );

    it('VALID: {flowrider, an observable addedBy siegemaster} => excluded, because that role runs after this track', () => {
      const flow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            flowriderSignoff: SignoffStub(),
            observables: [FlowObservableStub({ id: 'late-observable', addedBy: 'siegemaster' })],
          }),
        ],
        edges: [],
      });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([]);
    });
  });

  describe('nothing to measure', () => {
    it('EMPTY: {node-less, edge-less flow} => flowrider has zero units, because off-map is not its charter', () => {
      const flow = FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'flowrider' })).toStrictEqual([]);
    });

    it('EMPTY: {node-less, edge-less flow} => codeweaver has zero units too, because off-map is not its charter either', () => {
      const flow = FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'codeweaver' })).toStrictEqual([]);
    });

    it('EMPTY: {node-less, edge-less flow} => siegemaster still owns every off-map family', () => {
      const flow = FlowStub({ id: 'login-flow', flowType: 'runtime', nodes: [], edges: [] });

      expect(signoffFlowOutstandingTransformer({ flow, track: 'siegemaster' })).toStrictEqual(
        OFF_MAP_FAMILIES.map((family) => `login-flow:off-map:${family}`),
      );
    });
  });
});
