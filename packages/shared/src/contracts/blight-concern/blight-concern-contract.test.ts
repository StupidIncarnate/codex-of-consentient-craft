import { blightConcernContract } from './blight-concern-contract';
import { BlightConcernStub } from './blight-concern.stub';

describe('blightConcernContract', () => {
  describe('enum membership', () => {
    it('VALID: {options} => exposes exactly the five concern families', () => {
      expect(blightConcernContract.options).toStrictEqual([
        'craft',
        'perf',
        'dedup',
        'integrity',
        'test-cases',
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
    it('VALID: {no args} => defaults to craft', () => {
      expect(BlightConcernStub()).toBe('craft');
    });
  });

  describe('invalid input', () => {
    it('INVALID: {concern: "style"} => throws', () => {
      expect(() => BlightConcernStub({ value: 'style' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {concern: "coverage"} => throws, because the test track belongs to Flowrider and Siegemaster, not to a blight review unit', () => {
      expect(() => BlightConcernStub({ value: 'coverage' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {concern: "security"} => throws, because Siegemaster\'s hostile-input probe owns it by sending a real payload', () => {
      expect(() => BlightConcernStub({ value: 'security' })).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {concern: "dead-code"} => throws, because orphan-export detection needs the whole import graph and is a whole-diff minion, not a per-file crossing', () => {
      expect(() => BlightConcernStub({ value: 'dead-code' })).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {concern: ""} => throws', () => {
      expect(() => BlightConcernStub({ value: '' })).toThrow(/Invalid enum value/u);
    });
  });
});
