import { blightDispositionContract } from './blight-disposition-contract';
import { BlightDispositionStub } from './blight-disposition.stub';

describe('blightDispositionContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the five dispositions', () => {
      expect(blightDispositionContract.options).toStrictEqual([
        'reviewed',
        'fixed',
        'routed',
        'recorded',
        'gap',
      ]);
    });

    it.each(blightDispositionContract.options)(
      'VALID: {disposition: %s} => parses to itself, so every member can clear the completion gate',
      (disposition) => {
        expect(BlightDispositionStub({ value: disposition })).toBe(disposition);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to reviewed', () => {
      expect(BlightDispositionStub()).toBe('reviewed');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {disposition: "pending"} => throws, because a unit with no entry has no disposition at all', () => {
      expect(() => BlightDispositionStub({ value: 'pending' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {disposition: ""} => throws', () => {
      expect(() => BlightDispositionStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
