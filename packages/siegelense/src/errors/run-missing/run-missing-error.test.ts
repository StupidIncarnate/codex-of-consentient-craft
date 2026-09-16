import { RunMissingError } from './run-missing-error';

describe('RunMissingError', () => {
  describe('constructor()', () => {
    it('VALID: {instanceId: "inst_7f3a9c21", runId: "run_9"} => sets name and full message', () => {
      const error = new RunMissingError({ instanceId: 'inst_7f3a9c21', runId: 'run_9' });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RunMissingError',
        message:
          'No stored return for run "run_9" on instance "inst_7f3a9c21" — that run never completed, or its evidence was pruned.',
      });
    });

    it('EDGE: {runId: "run_1"} => names that exact run alongside the instance', () => {
      const error = new RunMissingError({ instanceId: 'inst_00000000', runId: 'run_1' });

      expect(error.message).toBe(
        'No stored return for run "run_1" on instance "inst_00000000" — that run never completed, or its evidence was pruned.',
      );
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RunMissingError => returns true', () => {
      const error = new RunMissingError({ instanceId: 'inst_7f3a9c21', runId: 'run_9' });

      expect(error instanceof RunMissingError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RunMissingError({ instanceId: 'inst_7f3a9c21', runId: 'run_9' });

      expect(error instanceof Error).toBe(true);
    });
  });
});
