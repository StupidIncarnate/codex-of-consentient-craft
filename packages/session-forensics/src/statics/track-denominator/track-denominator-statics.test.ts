import { trackDenominatorStatics } from './track-denominator-statics';

// Every declared track, walked off the static itself rather than hand-typed, so a row added later
// is swept into the absence guard below without anyone updating a second list.
const DECLARED_TRACK_NAMES = Object.keys(trackDenominatorStatics.byTrack);

// The automated methods each track is measured over, pinned per row so a widened element type
// cannot quietly drop one of the real ones.
const DECLARED_METHODS = [
  ['codeweaver', trackDenominatorStatics.byTrack.codeweaver, ['test', 'reading']] as const,
  ['flowrider', trackDenominatorStatics.byTrack.flowrider, ['test']] as const,
  ['siegemaster', trackDenominatorStatics.byTrack.siegemaster, ['test']] as const,
];

describe('trackDenominatorStatics', () => {
  describe('human-check verification method', () => {
    it('VALID: {human-check} => is a member of the verificationMethods element type, which is what lets a filter resolve a verifyByHuman unit to it', () => {
      // `===` against a literal outside the element union is a compile error (TS2367), so this
      // comparison only builds while 'human-check' is a member of that union.
      expect(
        trackDenominatorStatics.byTrack.codeweaver.verificationMethods.filter(
          (method) => method === 'human-check',
        ),
      ).toStrictEqual([]);
    });

    it.each(DECLARED_METHODS)(
      'VALID: {track: %s} => lists no human-check, so a human-only unit falls out of this denominator',
      (_label, track) => {
        expect(
          track.verificationMethods.filter((method) => method === 'human-check'),
        ).toStrictEqual([]);
      },
    );

    it.each(DECLARED_METHODS)(
      'VALID: {track: %s} => still lists exactly the automated methods it is measured over',
      (_label, track, expected) => {
        expect(track.verificationMethods).toStrictEqual(expected);
      },
    );

    it('VALID: {swept tracks} => the absence sweep covers every track the statics declares', () => {
      expect(DECLARED_METHODS.map(([label]) => label)).toStrictEqual(DECLARED_TRACK_NAMES);
    });
  });

  describe('full value', () => {
    it('VALID: {} => mirrors the orchestrator step-scope table, collapsed to one row per track', () => {
      expect(trackDenominatorStatics).toStrictEqual({
        mirrorOf: 'packages/orchestrator/src/statics/step-scope/step-scope-statics.ts',
        byTrack: {
          codeweaver: {
            flowTypes: ['runtime', 'operational'],
            unitKinds: ['terminal', 'branch', 'observable'],
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            verificationMethods: ['test', 'reading'],
          },
          flowrider: {
            flowTypes: ['runtime'],
            unitKinds: ['terminal', 'branch', 'observable'],
            observableOrigins: ['spec', 'chaoswhisperer', 'codeweaver', 'flowrider', 'operator'],
            verificationMethods: ['test'],
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
            verificationMethods: ['test'],
          },
        },
      });
    });
  });
});
