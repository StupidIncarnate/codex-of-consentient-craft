import { RunIdRequiredError } from './run-id-required-error';

describe('RunIdRequiredError', () => {
  describe('constructor()', () => {
    it('VALID: {instanceId, instanceState: "killed", runCount: 2} => sets name and full message', () => {
      const error = new RunIdRequiredError({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        runCount: 2,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RunIdRequiredError',
        message:
          'Instance inst_7f3a9c21 is killed with 2 run(s) recorded; "latest" cannot be guessed. ' +
          'Name a run with --run <runId>, or pass --since boot for the whole timeline. ' +
          'See dungeonmaster siegelense status --instance inst_7f3a9c21 for the run count.',
      });
    });

    it('EDGE: {instanceState: "dead", runCount: 1} => names the state and the count, and never a specific run id', () => {
      const error = new RunIdRequiredError({
        instanceId: 'inst_00000000',
        instanceState: 'dead',
        runCount: 1,
      });

      expect(error.message).toBe(
        'Instance inst_00000000 is dead with 1 run(s) recorded; "latest" cannot be guessed. ' +
          'Name a run with --run <runId>, or pass --since boot for the whole timeline. ' +
          'See dungeonmaster siegelense status --instance inst_00000000 for the run count.',
      );
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RunIdRequiredError => returns true', () => {
      const error = new RunIdRequiredError({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        runCount: 2,
      });

      expect(error instanceof RunIdRequiredError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RunIdRequiredError({
        instanceId: 'inst_7f3a9c21',
        instanceState: 'killed',
        runCount: 2,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
