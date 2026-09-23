import { verificationTrackContract } from './verification-track-contract';
import { VerificationTrackStub } from './verification-track.stub';

describe('verificationTrackContract', () => {
  describe('valid tracks', () => {
    it('VALID: {options} => three tracks, in relay order', () => {
      expect(verificationTrackContract.options).toStrictEqual([
        'codeweaver',
        'flowrider',
        'siegemaster',
      ]);
    });

    it.each(verificationTrackContract.options)(
      'VALID: {value: %s} => parses to itself',
      (track) => {
        expect(VerificationTrackStub({ value: track })).toBe(track);
      },
    );

    it('VALID: {no argument} => defaults to flowrider', () => {
      expect(VerificationTrackStub()).toBe('flowrider');
    });
  });

  describe('invalid tracks', () => {
    it('INVALID: {value: "blightwarden"} => throws, blightwarden signs no verification unit', () => {
      expect(() => VerificationTrackStub({ value: 'blightwarden' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: "flowriderSignoff"} => throws, a retired field name is not a track name', () => {
      expect(() => VerificationTrackStub({ value: 'flowriderSignoff' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {value: ""} => throws', () => {
      expect(() => VerificationTrackStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
