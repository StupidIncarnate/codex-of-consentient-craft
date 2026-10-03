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

  describe('resource sample assignment', () => {
    it('VALID: {peaks and shard counts as Map} => lands on the right package across multiple check types', () => {
      const wardLint = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 300,
      });
      const wardUnit = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 800,
      });
      const webE2e = ProjectResultStub({
        projectFolder: { name: 'web', path: '/repo/packages/web' },
        status: 'pass',
        durationMs: 4500,
      });

      const lintCheck = CheckResultStub({
        checkType: 'lint',
        status: 'pass',
        projectResults: [wardLint],
      });
      const unitCheck = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [wardUnit],
      });
      const e2eCheck = CheckResultStub({
        checkType: 'e2e',
        status: 'pass',
        projectResults: [webE2e],
      });

      const peakRssByPackage = new Map<string, number | null>([
        ['ward', 256],
        ['web', 1024],
      ]);
      const shardsByPackage = new Map<string, number | null>([['web', 3]]);

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [lintCheck, unitCheck, e2eCheck],
        wholePackageNames: ['ward', 'web'],
        nowMs: 1700000000000,
        peakRssByPackage,
        shardsByPackage,
      });

      expect(result).toStrictEqual([
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'lint',
          durationMs: 300,
          peakRssMB: 256,
          shards: null,
          recordedAtMs: 1700000000000,
        },
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 800,
          peakRssMB: 256,
          shards: null,
          recordedAtMs: 1700000000000,
        },
        {
          repoRoot: '/repo',
          packageName: 'web',
          checkType: 'e2e',
          durationMs: 4500,
          peakRssMB: 1024,
          shards: 3,
          recordedAtMs: 1700000000000,
        },
      ]);
    });

    it('VALID: {peaks and shard counts as Record} => lands on the right package', () => {
      const wardUnit = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 650,
      });
      const webE2e = ProjectResultStub({
        projectFolder: { name: 'web', path: '/repo/packages/web' },
        status: 'pass',
        durationMs: 3200,
      });

      const unitCheck = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [wardUnit],
      });
      const e2eCheck = CheckResultStub({
        checkType: 'e2e',
        status: 'pass',
        projectResults: [webE2e],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [unitCheck, e2eCheck],
        wholePackageNames: ['ward', 'web'],
        nowMs: 1700000000000,
        peakRssByPackage: {
          ward: 128,
          web: 512,
        },
        shardsByPackage: {
          web: 2,
        },
      });

      expect(result).toStrictEqual([
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 650,
          peakRssMB: 128,
          shards: null,
          recordedAtMs: 1700000000000,
        },
        {
          repoRoot: '/repo',
          packageName: 'web',
          checkType: 'e2e',
          durationMs: 3200,
          peakRssMB: 512,
          shards: 2,
          recordedAtMs: 1700000000000,
        },
      ]);
    });

    it('VALID: {package with no peak} => keeps null peakRssMB', () => {
      const wardUnit = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 400,
      });
      const sharedUnit = ProjectResultStub({
        projectFolder: { name: 'shared', path: '/repo/packages/shared' },
        status: 'pass',
        durationMs: 500,
      });

      const unitCheck = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [wardUnit, sharedUnit],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [unitCheck],
        wholePackageNames: ['ward', 'shared'],
        nowMs: 1700000000000,
        peakRssByPackage: {
          shared: null,
        },
      });

      expect(result).toStrictEqual([
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 400,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1700000000000,
        },
        {
          repoRoot: '/repo',
          packageName: 'shared',
          checkType: 'unit',
          durationMs: 500,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1700000000000,
        },
      ]);
    });

    it('VALID: {shards for package} => lands on that package while package with no shards keeps null', () => {
      const webE2e = ProjectResultStub({
        projectFolder: { name: 'web', path: '/repo/packages/web' },
        status: 'pass',
        durationMs: 2000,
      });
      const wardUnit = ProjectResultStub({
        projectFolder: { name: 'ward', path: '/repo/packages/ward' },
        status: 'pass',
        durationMs: 450,
      });

      const e2eCheck = CheckResultStub({
        checkType: 'e2e',
        status: 'pass',
        projectResults: [webE2e],
      });
      const unitCheck = CheckResultStub({
        checkType: 'unit',
        status: 'pass',
        projectResults: [wardUnit],
      });

      const result = durationSamplesBuildTransformer({
        repoRoot: '/repo',
        checks: [e2eCheck, unitCheck],
        wholePackageNames: ['web', 'ward'],
        nowMs: 1700000000000,
        shardsByPackage: new Map([
          ['web', 5],
          ['ward', null],
        ]),
      });

      expect(result).toStrictEqual([
        {
          repoRoot: '/repo',
          packageName: 'web',
          checkType: 'e2e',
          durationMs: 2000,
          peakRssMB: null,
          shards: 5,
          recordedAtMs: 1700000000000,
        },
        {
          repoRoot: '/repo',
          packageName: 'ward',
          checkType: 'unit',
          durationMs: 450,
          peakRssMB: null,
          shards: null,
          recordedAtMs: 1700000000000,
        },
      ]);
    });
  });
});
