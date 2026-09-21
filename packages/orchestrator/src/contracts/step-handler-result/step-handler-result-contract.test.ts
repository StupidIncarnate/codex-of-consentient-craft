import { stepHandlerResultContract } from './step-handler-result-contract';
import { StepHandlerResultStub } from './step-handler-result.stub';

describe('stepHandlerResultContract', () => {
  describe('valid results', () => {
    it('VALID: {outcome, detail} => parses with no resultRef', () => {
      const result = StepHandlerResultStub({ outcome: 'empty', detail: 'nothing to grade' });

      expect(stepHandlerResultContract.parse(result)).toStrictEqual({
        outcome: 'empty',
        detail: 'nothing to grade',
      });
    });

    it('VALID: {outcome, detail, resultRef} => parses with the back-link', () => {
      const result = StepHandlerResultStub({
        outcome: 'done',
        detail: 'run: 1780108054226-a080  lint: PASS',
        resultRef: 'wardResults/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      expect(stepHandlerResultContract.parse(result)).toStrictEqual({
        outcome: 'done',
        detail: 'run: 1780108054226-a080  lint: PASS',
        resultRef: 'wardResults/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {outcome: "confirmed"} => throws — not one of the four Outcome words', () => {
      expect(() => stepHandlerResultContract.parse({ outcome: 'confirmed', detail: 'x' })).toThrow(
        /confirmed/u,
      );
    });

    it('INVALID: {extra key} => throws — .strict() refuses an unrecognised field', () => {
      expect(() =>
        stepHandlerResultContract.parse({ outcome: 'done', detail: 'x', extra: 'nope' }),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
