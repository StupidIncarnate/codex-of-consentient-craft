import { runResultContract } from './run-result-contract';
import { RunResultStub } from './run-result.stub';

describe('runResultContract', () => {
  describe('valid results', () => {
    it('VALID: {status: done, stoppedAt: null} => a clean return parses', () => {
      const result = runResultContract.parse({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
        status: 'done',
        stepsRun: 5,
        stoppedAt: null,
        index: {
          console: { errors: 0, warnings: 2 },
          server: { errors: 0 },
          network: { exchanges: 14, non2xx: 0 },
        },
        shots: [
          {
            step: 1,
            path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
            open: true,
            why: 'start',
            node: null,
            pixelChange: null,
            blank: false,
            blankColour: null,
          },
        ],
      });

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
        status: 'done',
        stepsRun: 5,
        stoppedAt: null,
        index: {
          console: { errors: 0, warnings: 2 },
          server: { errors: 0 },
          network: { exchanges: 14, non2xx: 0 },
        },
        shots: [
          {
            step: 1,
            path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
            open: true,
            why: 'start',
            node: null,
            pixelChange: null,
            blank: false,
            blankColour: null,
          },
        ],
      });
    });

    it('VALID: {durationMs: 450} => parses with optional duration in milliseconds', () => {
      const result = runResultContract.parse({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_2',
        status: 'done',
        stepsRun: 5,
        stoppedAt: null,
        index: {
          console: { errors: 0, warnings: 2 },
          server: { errors: 0 },
          network: { exchanges: 14, non2xx: 0 },
        },
        shots: [],
        durationMs: 450,
      });

      expect(result.durationMs).toBe(450);
    });

    it('VALID: {status: failed, stoppedAt with two candidates} => a failing return carries the AMBIGUOUS key', () => {
      const result = runResultContract.parse({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_3',
        status: 'failed',
        stepsRun: 3,
        stoppedAt: {
          step: 4,
          verb: 'click',
          error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
          candidates: [
            { index: 0, within: '[data-testid="GUILD_LIST"]', text: '+', rect: '(444,348) 27x25' },
            {
              index: 1,
              within: '[data-testid="GUILD_SESSION_LIST"]',
              text: '+',
              rect: '(612,348) 27x25',
            },
          ],
        },
        index: {
          console: { errors: 0, warnings: 0 },
          server: { errors: 0 },
          network: { exchanges: 3, non2xx: 0 },
        },
        shots: [],
      });

      expect(result.stoppedAt?.candidates).toStrictEqual([
        {
          index: 0,
          ref: null,
          within: '[data-testid="GUILD_LIST"]',
          text: '+',
          rect: '(444,348) 27x25',
        },
        {
          index: 1,
          ref: null,
          within: '[data-testid="GUILD_SESSION_LIST"]',
          text: '+',
          rect: '(612,348) 27x25',
        },
      ]);
    });

    it('VALID: {status: timeout, stoppedAt.error names the target and the ceiling} => a hang is a finding', () => {
      const result = runResultContract.parse({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_5',
        status: 'timeout',
        stepsRun: 2,
        stoppedAt: {
          step: 3,
          verb: 'waitFor',
          error: 'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
          candidates: [],
        },
        index: {
          console: { errors: 1, warnings: 0 },
          server: { errors: 1 },
          network: { exchanges: 0, non2xx: 0 },
        },
        shots: [],
      });

      expect(result.stoppedAt?.error).toBe(
        'visible [data-testid="SUBAGENT_CHAIN"] never resolved in 20000ms',
      );
    });
  });

  describe('empty collections', () => {
    it('EMPTY: {shots: []} => a run of only eval steps took no shots and that is a real answer', () => {
      const result = runResultContract.parse({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_6',
        status: 'done',
        stepsRun: 2,
        stoppedAt: null,
        index: {
          console: { errors: 0, warnings: 0 },
          server: { errors: 0 },
          network: { exchanges: 0, non2xx: 0 },
        },
        shots: [],
      });

      expect(result.shots).toStrictEqual([]);
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing status} => throws validation error', () => {
      expect(() =>
        runResultContract.parse({
          instanceId: 'inst_7f3a9c21',
          runId: 'run_2',
          stepsRun: 5,
          stoppedAt: null,
          index: {
            console: { errors: 0, warnings: 0 },
            server: { errors: 0 },
            network: { exchanges: 0, non2xx: 0 },
          },
          shots: [],
        }),
      ).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates a done run with one open shot', () => {
      const result = RunResultStub();

      expect(result).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        runId: 'run_1',
        status: 'done',
        stepsRun: 5,
        stoppedAt: null,
        index: {
          console: { errors: 0, warnings: 2 },
          server: { errors: 0 },
          network: { exchanges: 14, non2xx: 0 },
        },
        shots: [
          {
            step: 1,
            path: '/repo/.siegelense/guilds/g1/instances/inst_1/runs/run_2/step1.png',
            open: true,
            why: 'start',
            node: null,
            pixelChange: '38%',
            blank: false,
            blankColour: null,
          },
        ],
      });
    });
  });
});
