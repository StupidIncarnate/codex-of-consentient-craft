import { signoffTrackEligibilityStatics } from './signoff-track-eligibility-statics';

type SignoffTrack = keyof typeof signoffTrackEligibilityStatics.byTrack;

const TRACKS = Object.keys(signoffTrackEligibilityStatics.byTrack) as SignoffTrack[];

// The two origins that name no relay role at all — the spec at approval, and a human writing an
// observable in out of band. Neither can be "after" a track, so both count for every track.
const NON_RELAY_ORIGINS = new Set(['spec', 'operator']);

describe('signoffTrackEligibilityStatics', () => {
  describe('flow-type ownership', () => {
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

  describe('unit-kind ownership', () => {
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

    it.each(TRACKS)(
      'VALID: {track: %s} => counts observables of its own origin, so its own discoveries stay its own to close',
      (track) => {
        const { observableOrigins } = signoffTrackEligibilityStatics.byTrack[track];

        expect(observableOrigins.filter((origin) => origin === track)).toStrictEqual([track]);
      },
    );
  });

  describe('full exported value', () => {
    it('VALID: {statics} => matches the complete eligibility map', () => {
      expect(signoffTrackEligibilityStatics).toStrictEqual({
        byTrack: {
          flowrider: {
            flowTypes: ['runtime'],
            unitKinds: ['terminal', 'branch', 'observable'],
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
          },
          siegemaster: {
            flowTypes: ['runtime', 'operational'],
            unitKinds: ['terminal', 'branch', 'observable', 'off-map'],
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
