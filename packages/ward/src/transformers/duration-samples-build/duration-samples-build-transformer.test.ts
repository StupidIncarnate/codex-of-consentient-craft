import { CheckResultStub } from '../../contracts/check-result/check-result.stub';
import { ProjectResultStub } from '../../contracts/project-result/project-result.stub';
import { durationSamplesBuildTransformer } from './duration-samples-build-transformer';

describe('durationSamplesBuildTransformer', () => {
  describe('sample building from check results', () => {
    it('VALID: {whole package, not crashed} => emits DurationSample with project duration and null resources', () => {
      const projectResult = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 1250,
      });

      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [projectResult],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [check],
        wholePackageNames: new Set(['ward']),
        nowMs: 1700000000000,
      });

      expect(result).toStrictEqual([
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 1250,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1700000000000,
        },
      ]);
    });

    it('VALID: {multiple check types} => emits one sample per check type', () => {
      const lintProjectResult = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 300,
      });
      const unitProjectResult = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 900,
      });

      const lintCheck = CheckResultStub({
        checkType: 'lint',
        status: 'pass',
        projectResults: [lintProjectResult],
      });
      const unitCheck = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [unitProjectResult],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [lintCheck, unitCheck],
        wholePackageNames: ['ward'],
        nowMs: 1700000000000,
      });

      expect(result).toStrictEqual([
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'lint',
          durationMs: 300,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1700000000000,
        },
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 900,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1700000000000,
        },
      ]);
    });
  });

  describe('filtering non-samples', () => {
    it('VALID: {crashed project result} => emits no sample for crashed project', () => {
      const crashedProject = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'fail',
        errors: [],
        testFailures: [],
        durationMs: 50,
      });

      const check = CheckResultStub({
        checkType: 'unit',
        status: 'fail',
        projectResults: [crashedProject],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [check],
        wholePackageNames: new Set(['ward']),
        nowMs: 1700000000000,
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {non-whole package} => emits no sample for package not in wholePackageNames', () => {
      const projectResult = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 500,
      });

      const check = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [projectResult],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [check],
        wholePackageNames: new Set(['shared']),
        nowMs: 1700000000000,
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty checks or wholePackageNames} => returns empty array', () => {
      const resultEmptyChecks = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [],
        wholePackageNames: new Set(['ward']),
        nowMs: 1700000000000,
      });

      const resultEmptyPackages = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [
          CheckResultStub({
            checkType: 'unit',
            projectResults: [
              ProjectResultStub({
                projectFolder: { name: 'ward', path: '/repo/packages/ward' },
              }),
            ],
          }),
        ],
        wholePackageNames: [],
        nowMs: 1700000000000,
      });

      expect(resultEmptyChecks).toStrictEqual([]);
      expect(resultEmptyPackages).toStrictEqual([]);
    });
  });
});
