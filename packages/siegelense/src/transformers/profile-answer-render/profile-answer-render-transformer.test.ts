import { SpecProfileStub } from '../../contracts/spec-profile/spec-profile.stub';
import { profileAnswerRenderTransformer } from './profile-answer-render-transformer';

describe('profileAnswerRenderTransformer', () => {
  describe('measured profile with samples', () => {
    it('VALID: {profile with samples} => renders metadata lines and aligned box-drawing table', () => {
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-stack',
        processes: 3,
        hash: 'a3f9c2e1',
        measuredAt: '2026-09-14',
        fromRuns: 14,
        bootMs: 20_000,
        samples: [
          { poolSize: 1, steadyMB: 1800, peakMB: 2600, runs: 9 },
          { poolSize: 3, steadyMB: 1920, peakMB: 2810, runs: 5 },
        ],
      });

      const result = profileAnswerRenderTransformer({ profile });

      expect(result).toBe(
        'SPEC: dungeonmaster-stack\n' +
          'PROCESSES: 3\n' +
          'HASH: a3f9c2e1\n' +
          'MEASURED: 2026-09-14 (boot: 20000ms, runs: 14)\n' +
          '┌──────┬────────┬────────┬──────┐\n' +
          '│ POOL │ STEADY │ PEAK   │ RUNS │\n' +
          '├──────┼────────┼────────┼──────┤\n' +
          '│ 1    │ 1800MB │ 2600MB │ 9    │\n' +
          '│ 3    │ 1920MB │ 2810MB │ 5    │\n' +
          '└──────┴────────┴────────┴──────┘\n',
      );
    });
  });

  describe('spec with no measured samples', () => {
    it('EMPTY: {samples: [], bootMs: null, measuredAt: null} => renders "none measured yet", boot "-" and measured "never"', () => {
      const profile = SpecProfileStub({
        specName: 'dungeonmaster-api',
        processes: 1,
        hash: 'b1c2d3e4',
        measuredAt: null,
        fromRuns: 0,
        bootMs: null,
        samples: [],
      });

      const result = profileAnswerRenderTransformer({ profile });

      expect(result).toBe(
        'SPEC: dungeonmaster-api\n' +
          'PROCESSES: 1\n' +
          'HASH: b1c2d3e4\n' +
          'MEASURED: never (boot: -, runs: 0)\n' +
          'SAMPLES: none measured yet\n',
      );
    });
  });
});
