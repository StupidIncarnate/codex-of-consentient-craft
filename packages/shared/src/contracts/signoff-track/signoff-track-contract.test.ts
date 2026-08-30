import { signoffTrackContract } from './signoff-track-contract';
import { SignoffTrackStub } from './signoff-track.stub';

describe('signoffTrackContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the independent sign-off columns, in relay order', () => {
      expect(signoffTrackContract.options).toStrictEqual([
        'codeweaver',
        'flowrider',
        'siegemaster',
      ]);
    });

    it.each(signoffTrackContract.options)(
      'VALID: {track: %s} => parses to itself, so each track can be recorded on its own field',
      (track) => {
        expect(SignoffTrackStub({ value: track })).toBe(track);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to flowrider', () => {
      expect(SignoffTrackStub()).toBe('flowrider');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {track: "signoffs"} => throws, because the pair is never collapsed into one nested block', () => {
      expect(() => SignoffTrackStub({ value: 'signoffs' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {track: ""} => throws', () => {
      expect(() => SignoffTrackStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
