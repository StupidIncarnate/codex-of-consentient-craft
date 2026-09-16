import { stepReadingContract } from './step-reading-contract';
import { StepReadingStub } from './step-reading.stub';

describe('stepReadingContract', () => {
  describe('valid readings', () => {
    it('VALID: {an acting step with a shot} => parses the complete reading with a measured pixelChange and a real serverWindow', () => {
      const result = stepReadingContract.parse({
        step: 2,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step2.png',
        pixelChange: '4%',
        blank: false,
        blankColour: null,
        serverWindow: { fromByte: 1024, toByte: 2048 },
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
        pixelChange: '4%',
        blank: false,
        blankColour: null,
        serverWindow: { fromByte: 1024, toByte: 2048 },
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
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: { fromByte: 2048, toByte: 2048 },
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
        pixelChange: '0%',
        blank: false,
        blankColour: null,
        serverWindow: { fromByte: 2048, toByte: 3072 },
        startedAtMs: 1_700_000_000_430,
        endedAtMs: 1_700_000_000_600,
      });

      expect(result.ok).toBe(false);
    });

    it('VALID: {blank: true, blankColour: "#0d0907"} => a blank capture reports its colour', () => {
      const result = stepReadingContract.parse({
        step: 5,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step5.png',
        pixelChange: '0%',
        blank: true,
        blankColour: '#0d0907',
        serverWindow: { fromByte: 3072, toByte: 3072 },
        startedAtMs: 1_700_000_000_600,
        endedAtMs: 1_700_000_000_800,
      });

      expect({ blank: result.blank, blankColour: result.blankColour }).toStrictEqual({
        blank: true,
        blankColour: '#0d0907',
      });
    });
  });

  describe('edge cases', () => {
    it('EDGE: {shot: null} => pixelChange, blank and blankColour are all null', () => {
      const result = stepReadingContract.parse({
        step: 3,
        verb: 'eval',
        node: null,
        ok: true,
        expected: 'ok',
        reading: '"Guild Hall"',
        shot: null,
        pixelChange: null,
        blank: null,
        blankColour: null,
        serverWindow: { fromByte: 0, toByte: 0 },
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_100,
      });

      expect({
        pixelChange: result.pixelChange,
        blank: result.blank,
        blankColour: result.blankColour,
      }).toStrictEqual({
        pixelChange: null,
        blank: null,
        blankColour: null,
      });
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
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
          pixelChange: null,
          blank: null,
          blankColour: null,
          serverWindow: { fromByte: 0, toByte: 0 },
          startedAtMs: 1_700_000_000_000,
        } as never),
      ).toThrow(/Required/u);
    });

    it('INVALID: {missing serverWindow} => throws validation error', () => {
      expect(() =>
        stepReadingContract.parse({
          step: 2,
          verb: 'click',
          node: null,
          ok: true,
          expected: 'ok',
          reading: 'clicked [data-testid="GUILD_ADD"]',
          shot: null,
          pixelChange: null,
          blank: null,
          blankColour: null,
          startedAtMs: 1_700_000_000_000,
          endedAtMs: 1_700_000_000_210,
        } as never),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a successful click reading with a shot, a measured pixelChange and a serverWindow', () => {
      const result = StepReadingStub();

      expect(result).toStrictEqual({
        step: 2,
        verb: 'click',
        node: null,
        ok: true,
        expected: 'ok',
        reading: 'clicked [data-testid="GUILD_ADD"]',
        shot: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step2.png',
        pixelChange: '38%',
        blank: false,
        blankColour: null,
        serverWindow: { fromByte: 0, toByte: 512 },
        startedAtMs: 1_700_000_000_000,
        endedAtMs: 1_700_000_000_210,
      });
    });
  });
});
