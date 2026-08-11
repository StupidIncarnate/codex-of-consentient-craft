import { questTypeRegistryStatics, signoffTracksStatics } from '@dungeonmaster/shared/statics';

import { signoffTrackEligibilityStatics } from './signoff-track-eligibility-statics';

type SignoffTrack = keyof typeof signoffTrackEligibilityStatics.byTrack;

const TRACKS = Object.keys(signoffTrackEligibilityStatics.byTrack) as SignoffTrack[];

// How the relay slices each track's items, read off the seed that mints them. A track fanned out BY
// FLOW gets one item per flow, so its `flowIds` are a slice of the flow dimension and the gate must
// read them; a track fanned out by package gets flow lists that are a by-product of where its
// package lands, so reading them would narrow on a dimension nobody sliced.
const FAN_OUT_BY_TRACK = new Map(
  questTypeRegistryStatics.feature.relayTail.flatMap((entry) =>
    'fanOutBy' in entry ? [[entry.role, entry.fanOutBy] as const] : [],
  ),
);
const FLOW_SCOPE_BY_FAN_OUT = new Map([
  ['flow', 'declared'],
  ['e2e-flow', 'declared'],
  ['package', 'every-eligible'],
]);

// The two origins that name no relay role at all — the spec at approval, and a human writing an
// observable in out of band. Neither can be "after" a track, so both count for every track.
const NON_RELAY_ORIGINS = new Set(['spec', 'operator']);

// Siegemaster's origin list is the one pinned 1:1 with `observableOriginContract`, so it is also
// the answer to "which track names are themselves observable origins". `groundstomper` is not one:
// it holds no additive spec authority, so nothing can ever carry `addedBy: 'groundstomper'`.
const ORIGIN_BEARING_TRACKS = TRACKS.filter((track) =>
  signoffTrackEligibilityStatics.byTrack.siegemaster.observableOrigins.some(
    (origin) => origin === track,
  ),
);

// The authoring tracks partition the package kinds between them; Siegemaster measures every kind.
const AUTHORING_TRACKS = TRACKS.filter((track) => track !== 'siegemaster');

describe('signoffTrackEligibilityStatics', () => {
  // `byTrack`'s keys ARE the denominator track names, and `signoffTracksStatics.denominators` is the
  // tuple `signoffDenominatorTrackContract` builds its enum from — so this pair is what stops the
  // two drifting. An entry with no declared name is unreachable from every surface a session touches
  // (`get-qa-checklist`, the quest summary row, the gate's reproduction call), which is the exact
  // shape of the gap that left groundstomper invisible; a declared name with no entry would be
  // accepted by the tool and then index nothing.
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
    it('VALID: {flowrider, groundstomper} => both measure the same field, because they are disjoint by package kind and never by field', () => {
      expect({
        flowrider: signoffTrackEligibilityStatics.byTrack.flowrider.signoffField,
        groundstomper: signoffTrackEligibilityStatics.byTrack.groundstomper.signoffField,
      }).toStrictEqual({
        flowrider: 'flowriderSignoff',
        groundstomper: 'flowriderSignoff',
      });
    });

    it('VALID: {siegemaster} => measures the other field alone, so signing one track never advances the other', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.signoffField).toBe(
        'siegemasterSignoff',
      );
    });

    it('VALID: {every track} => names one of exactly two fields, so three denominators stay a many-to-one map onto two columns', () => {
      expect([
        ...new Set(
          TRACKS.map((track) => signoffTrackEligibilityStatics.byTrack[track].signoffField),
        ),
      ]).toStrictEqual(['flowriderSignoff', 'siegemasterSignoff']);
    });
  });

  describe('flow-type ownership', () => {
    it('VALID: {flowrider} => measures runtime flows alone', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.flowTypes).toStrictEqual(['runtime']);
    });

    it('VALID: {groundstomper} => inherits the runtime-only exclusion, so an operational flow seeds it nothing', () => {
      expect(signoffTrackEligibilityStatics.byTrack.groundstomper.flowTypes).toStrictEqual([
        'runtime',
      ]);
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
    it('VALID: {flowrider} => measures every flow of an eligible type, because its items are sliced on the PACKAGE dimension', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.flowScope).toBe('every-eligible');
    });

    it('VALID: {groundstomper} => measures the flows its item declares, because it gets one item per e2e-eligible runtime flow', () => {
      expect(signoffTrackEligibilityStatics.byTrack.groundstomper.flowScope).toBe('declared');
    });

    it('VALID: {siegemaster} => measures the flows its item declares, because it gets one item per flow', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.flowScope).toBe('declared');
    });

    // The slicer and the gate must be duals: the gate reads an item's `flowIds` exactly when the
    // relay cut that item out of the flow dimension. Reading them for a package-sliced track leaves
    // its whole-quest fallback item ungated; NOT reading them for a flow-sliced track measures the
    // first of several sibling items over every sibling's flow, which it can never sign off.
    it('VALID: {every track} => its flow scope is the dual of the dimension the relay tail slices its items on', () => {
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
    it('VALID: {flowrider} => owns terminal, branch and observable, and NOT off-map', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.unitKinds).toStrictEqual([
        'terminal',
        'branch',
        'observable',
      ]);
    });

    it('VALID: {groundstomper} => owns terminal, branch and observable, and NOT off-map', () => {
      expect(signoffTrackEligibilityStatics.byTrack.groundstomper.unitKinds).toStrictEqual([
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
    it('VALID: {groundstomper} => measures only the package kinds a browser can reach', () => {
      expect(signoffTrackEligibilityStatics.byTrack.groundstomper.packageTypes).toStrictEqual([
        'frontend-react',
        'frontend-ink',
      ]);
    });

    it('VALID: {flowrider} => measures every package kind a browser cannot reach', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes).toStrictEqual([
        'http-backend',
        'mcp-server',
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

    // A unit landing in both denominators would be counted twice; one landing in neither would be
    // proven by nobody while both gates still read empty. Disjointness is the whole point of the key.
    it('VALID: {flowrider, groundstomper} => share no package kind, so no unit is owed to both', () => {
      const groundstomperKinds = new Set(
        signoffTrackEligibilityStatics.byTrack.groundstomper.packageTypes.map(String),
      );

      const shared = signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes
        .map(String)
        .filter((packageType) => groundstomperKinds.has(packageType));

      expect(shared).toStrictEqual([]);
    });

    it('VALID: {flowrider ∪ groundstomper} => covers exactly Siegemaster’s kinds, so no unit falls between them', () => {
      const authoringKinds = [
        ...signoffTrackEligibilityStatics.byTrack.flowrider.packageTypes.map(String),
        ...signoffTrackEligibilityStatics.byTrack.groundstomper.packageTypes.map(String),
      ].sort((left, right) => left.localeCompare(right));

      const everyKind = signoffTrackEligibilityStatics.byTrack.siegemaster.packageTypes
        .map(String)
        .sort((left, right) => left.localeCompare(right));

      expect(authoringKinds).toStrictEqual(everyKind);
    });

    it.each(AUTHORING_TRACKS)(
      'VALID: {track: %s} => measures a strict subset of the kinds Siegemaster measures',
      (track) => {
        const everyKind = new Set(
          signoffTrackEligibilityStatics.byTrack.siegemaster.packageTypes.map(String),
        );

        const unknown = signoffTrackEligibilityStatics.byTrack[track].packageTypes
          .map(String)
          .filter((packageType) => !everyKind.has(packageType));

        expect(unknown).toStrictEqual([]);
      },
    );
  });

  describe('package-slice ownership', () => {
    it('VALID: {flowrider} => partitions, because its items ARE the package dimension — one per package plus one seam', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.packageScope).toBe('partition');
    });

    it('VALID: {groundstomper} => intersects, because its items are one per e2e-eligible flow and there is no seam item to catch a glue unit a partition would drop', () => {
      expect(signoffTrackEligibilityStatics.byTrack.groundstomper.packageScope).toBe(
        'intersection',
      );
    });

    it('VALID: {siegemaster} => intersects, and states it rather than omitting it, because "this track does not partition" is a claim', () => {
      expect(signoffTrackEligibilityStatics.byTrack.siegemaster.packageScope).toBe('intersection');
    });

    // Exactly ONE track may partition: two partitioning tracks over the same enumeration would each
    // claim a disjoint slice of it and leave the other's slice owned by nobody.
    it('VALID: {every track} => exactly one partitions', () => {
      expect(
        TRACKS.filter(
          (track) => signoffTrackEligibilityStatics.byTrack[track].packageScope === 'partition',
        ),
      ).toStrictEqual(['flowrider']);
    });
  });

  describe('provenance eligibility', () => {
    it('VALID: {flowrider} => every origin except `siegemaster`, which runs after it', () => {
      expect(signoffTrackEligibilityStatics.byTrack.flowrider.observableOrigins).toStrictEqual([
        'spec',
        'chaoswhisperer',
        'codeweaver',
        'flowrider',
        'operator',
      ]);
    });

    it('VALID: {groundstomper} => every origin except `siegemaster`, which runs after it', () => {
      expect(signoffTrackEligibilityStatics.byTrack.groundstomper.observableOrigins).toStrictEqual([
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

    it('VALID: {groundstomper} => is no observable origin at all, so it can add none and is owed none', () => {
      const namesGroundstomper = TRACKS.flatMap((track) =>
        signoffTrackEligibilityStatics.byTrack[track].observableOrigins.map(String),
      ).filter((origin) => origin === 'groundstomper');

      expect(namesGroundstomper).toStrictEqual([]);
    });
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete eligibility map', () => {
      expect(signoffTrackEligibilityStatics).toStrictEqual({
        byTrack: {
          flowrider: {
            signoffField: 'flowriderSignoff',
            flowTypes: ['runtime'],
            flowScope: 'every-eligible',
            unitKinds: ['terminal', 'branch', 'observable'],
            packageTypes: [
              'http-backend',
              'mcp-server',
              'hook-handlers',
              'eslint-plugin',
              'cli-tool',
              'programmatic-service',
              'library',
            ],
            packageScope: 'partition',
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
          },
          groundstomper: {
            signoffField: 'flowriderSignoff',
            flowTypes: ['runtime'],
            flowScope: 'declared',
            unitKinds: ['terminal', 'branch', 'observable'],
            packageTypes: ['frontend-react', 'frontend-ink'],
            packageScope: 'intersection',
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
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
          },
        },
      });
    });
  });
});
