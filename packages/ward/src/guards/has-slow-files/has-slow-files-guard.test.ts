import { hasSlowFilesGuard } from './has-slow-files-guard';
import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { FileTimingStub } from '../../contracts/file-timing/file-timing.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { WardResultStub } from '../../contracts/ward-result/ward-result.stub';

describe('hasSlowFilesGuard', () => {
  describe('runs it calls slow', () => {
    it('VALID: {one suite over the test threshold} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                fileTimings: [
                  FileTimingStub({
                    filePath: 'src/a.test.ts',
                    durationMs: 3500,
                    testMs: 2900,
                    slowestTestMs: 2900,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(hasSlowFilesGuard({ wardResult })).toBe(true);
    });

    it('VALID: {slow only in the second check} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({ checkType: 'unit', status: 'pass', projectResults: [] }),
          CheckResultStub({
            checkType: 'integration',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                fileTimings: [
                  FileTimingStub({
                    filePath: 'src/b.test.ts',
                    durationMs: 9000,
                    testMs: 8100,
                    slowestTestMs: 8100,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(hasSlowFilesGuard({ wardResult })).toBe(true);
    });

    it('VALID: {lint, one file over the rule threshold} => returns true', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                fileTimings: [
                  FileTimingStub({
                    filePath: 'src/big-widget.tsx',
                    durationMs: 1900,
                    testMs: 0,
                    rulesMs: 3600,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(hasSlowFilesGuard({ wardResult })).toBe(true);
    });
  });

  describe('runs it lets through', () => {
    it('VALID: {every suite under the threshold} => returns false', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                fileTimings: [
                  FileTimingStub({ filePath: 'src/a.test.ts', durationMs: 9000, testMs: 150 }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(hasSlowFilesGuard({ wardResult })).toBe(false);
    });

    it('EDGE: {huge wall, tiny test bodies} => returns false, because wall is run position', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'unit',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                fileTimings: [
                  FileTimingStub({
                    filePath: 'src/first.test.ts',
                    durationMs: 30_600,
                    testMs: 200,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(hasSlowFilesGuard({ wardResult })).toBe(false);
    });

    it('EDGE: {lint, huge wall, small rule time} => returns false, because wall is the program build', () => {
      const wardResult = WardResultStub({
        checks: [
          CheckResultStub({
            checkType: 'lint',
            status: 'pass',
            projectResults: [
              ProjectResultStub({
                fileTimings: [
                  FileTimingStub({
                    filePath: 'src/adapters/rxjs/take/rxjs-take-adapter.ts',
                    durationMs: 8486.8,
                    testMs: 0,
                    rulesMs: 491.2,
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      expect(hasSlowFilesGuard({ wardResult })).toBe(false);
    });

    it('EMPTY: {no checks} => returns false', () => {
      expect(hasSlowFilesGuard({ wardResult: WardResultStub({ checks: [] }) })).toBe(false);
    });

    it('EMPTY: {wardResult: undefined} => returns false', () => {
      expect(hasSlowFilesGuard({})).toBe(false);
    });
  });
});
