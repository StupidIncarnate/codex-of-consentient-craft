import { blightConcernContract } from './blight-concern-contract';
import { BlightConcernStub } from './blight-concern.stub';

describe('blightConcernContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the seven concern families', () => {
      expect(blightConcernContract.options).toStrictEqual([
        'coverage',
        'craft',
        'security',
        'dedup',
        'perf',
        'integrity',
        'dead-code',
      ]);
    });

    it.each(blightConcernContract.options)(
      'VALID: {concern: %s} => parses to itself',
      (concern) => {
        expect(BlightConcernStub({ value: concern })).toBe(concern);
      },
    );
  });

  describe('default stub', () => {
    it('VALID: {no args} => defaults to coverage', () => {
      expect(BlightConcernStub()).toBe('coverage');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {concern: "style"} => throws', () => {
      expect(() => BlightConcernStub({ value: 'style' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {concern: ""} => throws', () => {
      expect(() => BlightConcernStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
