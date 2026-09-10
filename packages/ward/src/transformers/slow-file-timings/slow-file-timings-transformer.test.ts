import { slowFileTimingsTransformer } from './slow-file-timings-transformer';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { FileTimingStub } from '../../contracts/file-timing/file-timing.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';

describe('slowFileTimingsTransformer', () => {
  describe('a check that reports per-test durations', () => {
    it('VALID: {two suites over the test threshold} => returns both, slowest tests first', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/a.test.ts', durationMs: 2000, testMs: 1400 }),
              FileTimingStub({ filePath: 'src/b.test.ts', durationMs: 9000, testMs: 4200 }),
            ],
          }),
        ],
      });

      const result = slowFileTimingsTransformer({ check });

      expect(result.map((timing) => timing.filePath)).toStrictEqual([
        'src/b.test.ts',
        'src/a.test.ts',
      ]);
    });

    it('VALID: {huge wall, tiny test bodies} => returns nothing, because wall is run position', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({
                filePath: 'src/ran-first.test.ts',
                durationMs: 30_600,
                testMs: 200,
              }),
              FileTimingStub({ filePath: 'src/real.test.ts', durationMs: 3500, testMs: 2900 }),
            ],
          }),
        ],
      });

      const result = slowFileTimingsTransformer({ check });

      expect(result.map((timing) => timing.filePath)).toStrictEqual(['src/real.test.ts']);
    });

    it('EDGE: {test time exactly at the threshold} => not slow, the bar is exclusive', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/edge.test.ts', durationMs: 9000, testMs: 1000 }),
            ],
          }),
        ],
      });

      expect(slowFileTimingsTransformer({ check })).toStrictEqual([]);
    });

    it('VALID: {suites in two packages} => aggregates across both', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/web.test.ts', durationMs: 6000, testMs: 1400 }),
            ],
          }),
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/cli.test.ts', durationMs: 9000, testMs: 4200 }),
            ],
          }),
        ],
      });

      const result = slowFileTimingsTransformer({ check });

      expect(result.map((timing) => timing.filePath)).toStrictEqual([
        'src/cli.test.ts',
        'src/web.test.ts',
      ]);
    });
  });

  describe('a browser check, held to its own bar', () => {
    it('VALID: {e2e spec at 1.4s} => not slow, because a browser spec is not a jest suite', () => {
      const check = CheckResultStub({
        checkType: 'e2e',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/a.e2e.ts', durationMs: 1400, testMs: 1400 }),
            ],
          }),
        ],
      });

      expect(slowFileTimingsTransformer({ check })).toStrictEqual([]);
    });

    it('VALID: {e2e spec at 6s} => slow, because it is over the browser bar', () => {
      const check = CheckResultStub({
        checkType: 'e2e',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/slow.e2e.ts', durationMs: 6000, testMs: 6000 }),
            ],
          }),
        ],
      });

      expect(slowFileTimingsTransformer({ check }).map((t) => t.filePath)).toStrictEqual([
        'src/slow.e2e.ts',
      ]);
    });

    it('VALID: {a unit suite at the same 1.4s} => slow, so the two bars really do differ', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/a.test.ts', durationMs: 1400, testMs: 1400 }),
            ],
          }),
        ],
      });

      expect(slowFileTimingsTransformer({ check }).map((t) => t.filePath)).toStrictEqual([
        'src/a.test.ts',
      ]);
    });
  });

  describe('a check that reports no per-test durations', () => {
    it('VALID: {lint, wall over the wall threshold} => falls back to wall', () => {
      const check = CheckResultStub({
        checkType: 'lint',
        status: 'pass',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/big.tsx', durationMs: 6000, testMs: 0 }),
              FileTimingStub({ filePath: 'src/small.tsx', durationMs: 400, testMs: 0 }),
            ],
          }),
        ],
      });

      const result = slowFileTimingsTransformer({ check });

      expect(result.map((timing) => timing.filePath)).toStrictEqual(['src/big.tsx']);
    });
  });

  describe('checks it ignores', () => {
    it('EDGE: {a skipped check} => returns nothing even when a timing is over threshold', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'skip',
        projectResults: [
          ProjectResultStub({
            fileTimings: [
              FileTimingStub({ filePath: 'src/slow.test.ts', durationMs: 9000, testMs: 4200 }),
            ],
          }),
        ],
      });

      expect(slowFileTimingsTransformer({ check })).toStrictEqual([]);
    });

    it('EMPTY: {no timings at all} => returns nothing', () => {
      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [ProjectResultStub({ fileTimings: [] })],
      });

      expect(slowFileTimingsTransformer({ check })).toStrictEqual([]);
    });
  });
});
