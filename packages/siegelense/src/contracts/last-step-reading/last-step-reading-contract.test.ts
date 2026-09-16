import { lastStepReadingContract } from './last-step-reading-contract';
import { LastStepReadingStub } from './last-step-reading.stub';

describe('lastStepReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {run: "run_2", step: 7, verb: "click"} => parses spec line 1177 verbatim', () => {
      const reading = LastStepReadingStub({ run: 'run_2', step: 7, verb: 'click' });

      const result = lastStepReadingContract.parse(reading);

      expect(result).toStrictEqual({ run: 'run_2', step: 7, verb: 'click' });
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing verb} => throws Required', () => {
      expect(() =>
        lastStepReadingContract.parse({
          run: 'run_2',
          step: 7,
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {verb: "hover"} => throws for a verb outside the six', () => {
      expect(() =>
        lastStepReadingContract.parse({
          run: 'run_2',
          step: 7,
          verb: 'hover',
        }),
      ).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {run: "step_2"} => throws for a run id outside the run prefix', () => {
      expect(() =>
        lastStepReadingContract.parse({
          run: 'step_2',
          step: 7,
          verb: 'click',
        }),
      ).toThrow(/invalid_string/u);
    });
  });
});
