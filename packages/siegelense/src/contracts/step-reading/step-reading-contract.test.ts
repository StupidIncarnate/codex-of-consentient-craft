import { stepReadingContract } from './step-reading-contract';
import { StepReadingStub } from './step-reading.stub';

describe('stepReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {an acting step with a shot} => parses the complete reading', () => {
      const result = stepReadingContract.parse({
        step: 2,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step2.png',
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_210,
      });

      expect(result).toStrictEqual({
        step: 2,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step2.png',
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_210,
      });
    });

    it('VALID: {shot: null, node: a label} => a non-acting step took no shot but reached a named node', () => {
      const result = stepReadingContract.parse({
        step: 3,
        verb: 'waitFor',
        node: 'chain-rendered',
        ok: true,
        expected: 'ok',
        reading: 'visible [data-testid="SUBAGENT_CHAIN"]',
        shot: null,
        startedAtMs: 1_700_000_000_210,
        endedAtMs: 1_700_000_000_430,
      });

      expect(result.shot).toBe(null);
    });

    it('ERROR: {expected: error, ok: false} => a step that expected failure and got it parses as a reading', () => {
      const result = stepReadingContract.parse({
        step: 4,
        verb: 'type',
        node: null,
        ok: false,
        expected: 'error',
        reading: 'rejected 400 Bad Request',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step4.png',
        startedAtMs: 1_700_000_000_430,
        endedAtMs: 1_700_000_000_600,
      });

      expect(result.ok).toBe(false);
    });
  });

  describe('invalid readings', () => {
    it('INVALID: {missing reading} => throws validation error', () => {
      expect(() =>
        stepReadingContract.parse({
          step: 2,
          verb: 'click',
          node: null,
          ok: true,
          expected: 'ok',
          shot: null,
          startedAtMs: 1_700_000_000_000,
          endedAtMs: 1_700_000_000_210,
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing endedAtMs} => throws validation error', () => {
      expect(() =>
        stepReadingContract.parse({
          step: 2,
          verb: 'click',
          node: null,
          ok: true,
          expected: 'ok',
          reading: 'clicked [data-testid="GUILD_ADD"]',
          shot: null,
          startedAtMs: 1_700_000_000_000,
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a successful click reading with a shot', () => {
      const result = StepReadingStub();

      expect(result).toStrictEqual({
        step: 2,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step2.png',
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_210,
      });
    });
  });
});
