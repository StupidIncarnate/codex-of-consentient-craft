import { stepBatchProbeContract } from './step-batch-probe-contract';
import { StepBatchProbeStub } from './step-batch-probe.stub';

describe('stepBatchProbeContract', () => {
  describe('valid batches', () => {
    it('VALID: {default stub} => keeps the step verb', () => {
      const result = stepBatchProbeContract.parse(StepBatchProbeStub());

      expect(result).toStrictEqual([{ step: 'goto', path: '/' }]);
    });

    it('VALID: {entry carrying a stray key} => keeps the stray key so it can be named', () => {
      const result = StepBatchProbeStub({ value: [{ step: 'goto', path: '/', bogus: true }] });

      expect(result).toStrictEqual([{ step: 'goto', path: '/', bogus: true }]);
    });

    it('EMPTY: {entry without a step} => parses, leaving the real contract to refuse it', () => {
      const result = StepBatchProbeStub({ value: [{ path: '/' }] });

      expect(result).toStrictEqual([{ path: '/' }]);
    });
  });

  describe('invalid batches', () => {
    it('INVALID: {entry that is a string} => throws validation error', () => {
      expect(() => StepBatchProbeStub({ value: ['goto'] })).toThrow(/Expected object/u);
    });

    it('INVALID: {step: 7} => throws validation error', () => {
      expect(() => StepBatchProbeStub({ value: [{ step: 7 }] })).toThrow(/Expected string/u);
    });

    it('INVALID: {not an array} => throws validation error', () => {
      expect(() => StepBatchProbeStub({ value: { step: 'goto' } })).toThrow(/Expected array/u);
    });
  });
});
