import { signoffVerdictContract } from './signoff-verdict-contract';
import { SignoffVerdictStub } from './signoff-verdict.stub';

describe('signoffVerdictContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly confirmed and unconfirmable', () => {
      expect(signoffVerdictContract.options).toStrictEqual(['confirmed', 'unconfirmable']);
    });

    it.each(signoffVerdictContract.options)(
      'VALID: {verdict: %s} => parses to itself, so either track can answer for its own unit',
      (verdict) => {
        expect(SignoffVerdictStub({ value: verdict })).toBe(verdict);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to confirmed', () => {
      expect(SignoffVerdictStub()).toBe('confirmed');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {verdict: "gap"} => throws, because a measured defect becomes a new observable rather than a verdict', () => {
      expect(() => SignoffVerdictStub({ value: 'gap' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {verdict: ""} => throws', () => {
      expect(() => SignoffVerdictStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
