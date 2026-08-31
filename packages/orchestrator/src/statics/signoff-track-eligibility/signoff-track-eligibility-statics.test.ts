import { questTypeRegistryStatics, signoffTracksStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from './signoff-track-eligibility-statics';

type SignoffTrack = keyof typeof signoffTrackEligibilityStatics.byTrack;

const TRACKS = Object.keys(signoffTrackEligibilityStatics.byTrack) as SignoffTrack[];

// How the relay slices each track's items, read off the seed that mints them. A track fanned out BY
// FLOW gets one item per flow, so its `flowIds` are a slice of the flow dimension and the gate must
// read them.
//
// BOTH seed lists are read, not just `relayTail`: `codeweaver` is seeded on
// `startImplementationOps` and is a denominator all the same, so scanning the tail alone would
// resolve its fan-out to `undefined` and compare a real flow scope against nothing.
const FAN_OUT_BY_TRACK = new Map(
  [
    ...questTypeRegistryStatics.feature.startImplementationOps,
    ...questTypeRegistryStatics.feature.relayTail,
  ].flatMap((entry) => ('fanOutBy' in entry ? [[entry.role, entry.fanOutBy] as const] : [])),
);
const FLOW_SCOPE_BY_FAN_OUT = new Map([
  ['flow', 'declared'],
  // An implementation item is ONE package carrying every flow that package tags a node in, so its
  // `flowIds` are still a real slice of the flow dimension — the same dual as the flow-sliced pair.
  ['implementation', 'declared'],
]);

// The two origins that name no relay role at all — the spec at approval, and a human writing an
// observable in out of band. Neither can be "after" a track, so both count for every track.
const NON_RELAY_ORIGINS = new Set(['spec', 'operator']);

// Siegemaster's origin list is the one pinned 1:1 with `observableOriginContract`, so it is also
// the answer to "which track names are themselves observable origins".
const ORIGIN_BEARING_TRACKS = TRACKS.filter((track) =>
  signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins.some(
    (origin) => origin === track,
  ),
);

describe('signoffTrackEligibilityStatics', () => {
  // `byTrack`'s keys ARE the denominator track names, and `signoffTracksStatics.denominators` is the
  // tuple `signoffDenominatorTrackContract` builds its enum from — so this pair is what stops the
  // two drifting. An entry with no declared name is unreachable from every surface a session touches
  // (`get-qa-checklist`, the quest summary row, the gate's reproduction call); a declared name with
  // no entry would be accepted by the tool and then index nothing.
  describe('key set', () => {
    it('VALID: {every eligibility entry} => is a name a caller can pass, so no denominator is unreachable', () => {
      const declared = new Set(signoffTracksStatics.denominators.map(String));

      expect(TRACKS.filter((track) => !declared.has(track))).toStrictEqual([]);
    });

    it('VALID: {every declared denominator} => has an entry here, so no name resolves to no scope', () => {
      const keyed = new Set(TRACKS.map(String));

      expect(signoffTracksStatics.denominators.filter((track) => !keyed.has(track))).toStrictEqual(
        [],
      );
    });
  });

  describe('sign-off field routing', () => {
    it('VALID: {codeweaver} => measures a column of its own, because a unit test is a different kind of proof from a flow-perspective one', () => {
      expect(signoffTrackEligibilityStatics.byTrack.codeweaver.signoffField).toBe(
        'codeweaverSignoff',
      );
    });

    it('VALID: {flowrider} => measures the flow-perspective column', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.signoffField).toBe(
        'flowriderSignoff',
      );
    });

    it('VALID: {siegemaster} => measures the hands-on column alone, so signing one track never advances the other', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.signoffField).toBe(
        'siegemasterSignoff',
      );
    });

    it('VALID: {every track} => names one of exactly three fields, so the denominators stay a many-to-one map onto three columns', () => {
      expect([
        ...new Set(
          TRACKS.map((track) => signoffTrackEligibilityStatics.byTrack[track].signoffField),
        ),
      ]).toStrictEqual(['codeweaverSignoff', 'flowriderSignoff', 'siegemasterSignoff']);
    });
  });

  describe('flow-type ownership', () => {
    it('VALID: {codeweaver} => measures both flow types, because it builds the code behind an operational flow too', () => {
      expect(signoffTrackEligibilityStatics.byTrack.codeweaver.flowTypes).toStrictEqual([
        'runtime',
        'operational',
      ]);
    });

    it('VALID: {flowrider} => measures runtime flows alone', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.flowTypes).toStrictEqual(['runtime']);
    });

    it('VALID: {siegemaster} => measures both flow types, because it checks end states too', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.flowTypes).toStrictEqual([
        'runtime',
        'operational',
      ]);
    });

    it.each(TRACKS)('VALID: {track: %s} => always measures runtime flows', (track) => {
      const { flowTypes } = signoffTrackEligibilityStatics.byTrack[track];

      expect(flowTypes.filter((flowType) => flowType === 'runtime')).toStrictEqual(['runtime']);
    });
  });

  describe('flow-slice ownership', () => {
    it('VALID: {codeweaver} => measures the flows its item declares, because an implementation item carries its package’s own flows', () => {
      expect(signoffTrackEligibilityStatics.byTrack.codeweaver.flowScope).toBe('declared');
    });

    it('VALID: {flowrider} => measures the flows its item declares, because it gets one item per flow', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.flowScope).toBe('declared');
    });

    it('VALID: {siegemaster} => measures the flows its item declares, because it gets one item per flow', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.flowScope).toBe('declared');
    });

    // The slicer and the gate must be duals: the gate reads an item's `flowIds` exactly when the
    // relay cut that item out of the flow dimension. NOT reading them for a flow-sliced track
    // measures the first of several sibling items over every sibling's flow, which it can never
    // sign off.
    it('VALID: {every track} => its flow scope is the dual of the dimension the relay slices its items on', () => {
      expect(
        TRACKS.map(
          (track) => `${track}: ${signoffTrackEligibilityStatics.byTrack[track].flowScope}`,
        ),
      ).toStrictEqual(
        TRACKS.map(
          (track) =>
            `${track}: ${String(FLOW_SCOPE_BY_FAN_OUT.get(String(FAN_OUT_BY_TRACK.get(track))))}`,
        ),
      );
    });
  });

  describe('unit-kind ownership', () => {
    it('VALID: {codeweaver} => owns terminal, branch and observable, and NOT off-map — the probe families need a human driving a running system', () => {
      expect(signoffTrackEligibilityStatics.byTrack.codeweaver.unitKinds).toStrictEqual([
        'terminal',
        'branch',
        'observable',
      ]);
    });

    it('VALID: {flowrider} => owns terminal, branch and observable, and NOT off-map', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.unitKinds).toStrictEqual([
        'terminal',
        'branch',
        'observable',
      ]);
    });

    it('VALID: {siegemaster} => owns every unit kind, off-map included', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.unitKinds).toStrictEqual([
        'terminal',
        'branch',
        'observable',
        'off-map',
      ]);
    });
  });

  describe('package-kind ownership', () => {
    it('VALID: {codeweaver} => measures every package kind, because it is the role that builds every one of them', () => {
      expect(signoffTrackEligibilityStatics.byTrack.codeweaver.packageTypes).toStrictEqual([
        'http-backend',
        'mcp-server',
        'frontend-react',
        'frontend-ink',
        'hook-handlers',
        'eslint-plugin',
        'cli-tool',
        'programmatic-service',
        'library',
      ]);
    });

    it('VALID: {flowrider} => measures every package kind, because one flow crosses the browser and the backend alike', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes).toStrictEqual([
        'http-backend',
        'mcp-server',
        'frontend-react',
        'frontend-ink',
        'hook-handlers',
        'eslint-plugin',
        'cli-tool',
        'programmatic-service',
        'library',
      ]);
    });

    it('VALID: {siegemaster} => measures every package kind, because it drives the whole system', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.packageTypes).toStrictEqual([
        'http-backend',
        'mcp-server',
        'frontend-react',
        'frontend-ink',
        'hook-handlers',
        'eslint-plugin',
        'cli-tool',
        'programmatic-service',
        'library',
      ]);
    });

    // No track narrows by kind, so a unit that lands in any package kind at all is owed to all
    // three. A kind missing from one list would be a unit that track's gate reads as empty while
    // nothing says so.
    it.each(TRACKS)(
      'VALID: {track: %s} => measures exactly the kinds Siegemaster measures, so no unit is owned by nobody',
      (track) => {
        expect(
          signoffTrackEligibilityStatics.byTrack[track].packageTypes.map(String),
        ).toStrictEqual(
          signoffTrackEligibilityStatics.byTrack.siegemaster.packageTypes.map(String),
        );
      },
    );
  });

  describe('package-slice ownership', () => {
    // No track mints a seam item, so a glue unit dropped by an item that names only some of its
    // node's packages would be owned by nobody at all.
    it.each(TRACKS)(
      'VALID: {track: %s} => intersects, so a glue unit lands in every item whose names its node tags',
      (track) => {
        expect(signoffTrackEligibilityStatics.byTrack[track].packageScope).toBe('intersection');
      },
    );
  });

  describe('provenance eligibility', () => {
    it('VALID: {codeweaver} => every origin except `siegemaster`, which runs after it — `flowrider` included, because a pt N item runs after Flowrider added it', () => {
      expect(signoffTrackEligibilityStatics.byTrack.codeweaver.observableOrigins).toStrictEqual([
        'spec',
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'operator',
      ]);
    });

    it('VALID: {flowrider} => every origin except `siegemaster`, which runs after it', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins).toStrictEqual([
        'spec',
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'operator',
      ]);
    });

    it('VALID: {siegemaster} => every origin, because nothing on the relay runs after it', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins).toStrictEqual([
        'spec',
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'siegemaster',
        'operator',
      ]);
    });

    it.each(TRACKS)(
      'VALID: {track: %s} => counts `spec` and `operator`, the two origins that are not relay roles',
      (track) => {
        const { observableOrigins } = signoffTrackEligibilityStatics.byTrack[track];

        expect(observableOrigins.filter((origin) => NON_RELAY_ORIGINS.has(origin))).toStrictEqual([
          'spec',
          'operator',
        ]);
      },
    );

    it.each(ORIGIN_BEARING_TRACKS)(
      'VALID: {track: %s} => counts observables of its own origin, so its own discoveries stay its own to close',
      (track) => {
        const { observableOrigins } = signoffTrackEligibilityStatics.byTrack[track];

        expect(observableOrigins.filter((origin) => origin === track)).toStrictEqual([track]);
      },
    );

    // Every denominator writes observables of its own, so every one of them is an origin. A track
    // that were not would be a role able to add none and owed none.
    it('VALID: {every track} => is itself an observable origin', () => {
      expect(ORIGIN_BEARING_TRACKS).toStrictEqual(TRACKS);
    });
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete eligibility map', () => {
      expect(signoffTrackEligibilityStatics).toStrictEqual({
        byTrack: {
          codeweaver: {
            signoffField: 'codeweaverSignoff',
            flowTypes: ['runtime', 'operational'],
            flowScope: 'declared',
            unitKinds: ['terminal', 'branch', 'observable'],
            packageTypes: [
              'http-backend',
              'mcp-server',
              'frontend-react',
              'frontend-ink',
              'hook-handlers',
              'eslint-plugin',
              'cli-tool',
              'programmatic-service',
              'library',
            ],
            packageScope: 'intersection',
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            verificationMethods: ['test', 'reading'],
          },
          flowrider: {
            signoffField: 'flowriderSignoff',
            flowTypes: ['runtime'],
            flowScope: 'declared',
            unitKinds: ['terminal', 'branch', 'observable'],
            packageTypes: [
              'http-backend',
              'mcp-server',
              'frontend-react',
              'frontend-ink',
              'hook-handlers',
              'eslint-plugin',
              'cli-tool',
              'programmatic-service',
              'library',
            ],
            packageScope: 'intersection',
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            verificationMethods: ['test'],
          },
          siegemaster: {
            signoffField: 'siegemasterSignoff',
            flowTypes: ['runtime', 'operational'],
            flowScope: 'declared',
            unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
            packageTypes: [
              'http-backend',
              'mcp-server',
              'frontend-react',
              'frontend-ink',
              'hook-handlers',
              'eslint-plugin',
              'cli-tool',
              'programmatic-service',
              'library',
            ],
            packageScope: 'intersection',
            observableOrigins: [
              'spec',
              'chaoswhisperer',
              'codeweaver',
              'flowrider',
              'siegemaster',
              'operator',
            ],
            verificationMethods: ['test'],
          },
        },
      });
    });
  });
});
