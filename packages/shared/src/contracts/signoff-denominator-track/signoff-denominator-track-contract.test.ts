import { signoffTrackContract } from '../signoff-track/signoff-track-contract';
import { signoffDenominatorTrackContract } from './signoff-denominator-track-contract';
import { SignoffDenominatorTrackStub } from './signoff-denominator-track.stub';

describe('signoffDenominatorTrackContract', () => {
  describe('valid tracks', () => {
    it('VALID: {options} => three denominators, in relay order', () => {
      expect(signoffDenominatorTrackContract.options).toStrictEqual([
        'flowrider',
        'groundstomper',
        'siegemaster',
      ]);
    });

    it.each(signoffDenominatorTrackContract.options)(
      'VALID: {value: %s} => parses to itself',
      (track) => {
        expect(SignoffDenominatorTrackStub({ value: track })).toBe(track);
      },
    );

    it('VALID: {no argument} => defaults to flowrider', () => {
      expect(SignoffDenominatorTrackStub()).toBe('flowrider');
    });
  });

  describe('relationship to the sign-off FIELD contract', () => {
    // Groundstomper is the member that exists here and nowhere else: it writes `flowriderSignoff`,
    // so it is no field of its own, but it is measured over its own package kinds, so it is a
    // denominator of its own. A reader reaching for the wrong enum gets the other's set.
    it('VALID: {denominators minus fields} => groundstomper alone', () => {
      const fields = new Set(signoffTrackContract.options.map(String));

      expect(
        signoffDenominatorTrackContract.options.filter((track) => !fields.has(track)),
      ).toStrictEqual(['groundstomper']);
    });

    it('VALID: {every sign-off field} => is also a denominator, so a field always has a scope', () => {
      const denominators = new Set(signoffDenominatorTrackContract.options.map(String));

      expect(
        signoffTrackContract.options.filter((track) => !denominators.has(track)),
      ).toStrictEqual([]);
    });
  });

  describe('invalid tracks', () => {
    it('INVALID: {value: "blightwarden"} => throws, blightwarden signs no verification unit', () => {
      expect(() => SignoffDenominatorTrackStub({ value: 'blightwarden' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('INVALID: {value: "flowriderSignoff"} => throws, the FIELD name is not a denominator name', () => {
      expect(() => SignoffDenominatorTrackStub({ value: 'flowriderSignoff' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {value: ""} => throws', () => {
      expect(() => SignoffDenominatorTrackStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
