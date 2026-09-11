import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';
import { TestFailureStub } from '../../../contracts/test-failure/test-failure.stub';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { FileTimingStub } from '../../../contracts/file-timing/file-timing.stub';
import { PassingTestStub } from '../../../contracts/passing-test/passing-test.stub';

import { checkRunE2eBroker } from './check-run-e2e-broker';
import { checkRunE2eBrokerProxy } from './check-run-e2e-broker.proxy';

describe('checkRunE2eBroker', () => {
  describe('skip', () => {
    it('VALID: {not e2e-eligible} => returns skip result', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupNotE2eEligible({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'not e2e-eligible (packageType is not frontend-react or frontend-ink)',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('eligible but missing playwright.config.ts', () => {
    it('VALID: {e2e-eligible package, no playwright.config.ts} => returns fail result, not skip', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupEligibleMissingConfig({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'e2e-eligible package is missing playwright.config.ts',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('passing tests', () => {
    it('VALID: {playwright exits 0 with empty output} => returns pass result with no test failures', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {playwright exits 0 with line output} => returns pass result with filesCount from line output', async () => {
      const lineOutput = [
        '[1/2] [chromium] › packages/web/src/flows/app/smoke.e2e.ts:20:7 › Smoke › loads page',
        '[2/2] [chromium] › packages/web/src/flows/quest-chat/chat.e2e.ts:10:7 › Chat › sends message',
      ].join('\n');
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithOutput({ projectFolder, stdout: lineOutput });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          filesCount: 2,
          onlyDiscovered: ['discovered.ts'],
          onlyProcessed: [
            'packages/web/src/flows/app/smoke.e2e.ts',
            'packages/web/src/flows/quest-chat/chat.e2e.ts',
          ],
          rawOutput: RawOutputStub({
            stdout: lineOutput,
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });
  });

  describe('failing tests', () => {
    it('VALID: {playwright exits 1 with failure output} => returns fail result with parsed test failures', async () => {
      const failOutput = [
        '[1/1] [chromium] › packages/web/src/flows/home/login.e2e.ts:10:7 › Login › should display login form',
        '  1) [chromium] › packages/web/src/flows/home/login.e2e.ts:10:7 › Login › should display login form ',
        '',
        '    Element not found',
        '',
      ].join('\n');
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFail({ projectFolder, stdout: failOutput });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [
            TestFailureStub({
              suitePath: 'packages/web/src/flows/home/login.e2e.ts',
              testName: 'Login › should display login form',
              message: 'Element not found',
            }),
          ],
          filesCount: 1,
          onlyProcessed: ['packages/web/src/flows/home/login.e2e.ts'],
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({ stdout: failOutput, stderr: '', exitCode: 1 }),
        }),
      );
    });
  });

  describe('fail with empty output', () => {
    it('VALID: {playwright exits 1 with empty output} => returns fail result with no test failures', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFailWithEmptyOutput({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'fail',
          errors: [],
          testFailures: [],
          onlyDiscovered: ['discovered.ts'],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: '',
            exitCode: 1,
          }),
        }),
      );
    });
  });

  describe('file list filtering', () => {
    it('VALID: {fileList with e2e spec files} => appends only e2e file paths to playwright args', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({
        projectFolder,
        fileList: [GitRelativePathStub({ value: 'packages/web/src/flows/home/login.e2e.ts' })],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'test',
        '--reporter=line,json',
        'packages/web/src/flows/home/login.e2e.ts',
      ]);
    });

    it('VALID: {fileList with no e2e files} => returns skip result', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/user/user-broker.ts' }),
          GitRelativePathStub({ value: 'src/guards/is-admin/is-admin-guard.test.ts' }),
        ],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 0,
          projectFolder,
          status: 'skip',
          errors: [],
          testFailures: [],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: 'no matching e2e test files in passthrough',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {fileList with mixed files} => passes only e2e files to playwright', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({
        projectFolder,
        fileList: [
          GitRelativePathStub({ value: 'src/brokers/user/user-broker.ts' }),
          GitRelativePathStub({ value: 'packages/web/src/flows/app/smoke.e2e.ts' }),
        ],
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'test',
        '--reporter=line,json',
        'packages/web/src/flows/app/smoke.e2e.ts',
      ]);
    });
  });

  describe('passingTests from json report', () => {
    it('VALID: {playwright writes json report with passing specs} => returns passingTests populated', async () => {
      const projectFolder = ProjectFolderStub();
      const jsonContent = JSON.stringify({
        suites: [
          {
            title: 'packages/web/src/flows/app/smoke.e2e.ts',
            specs: [
              {
                title: 'loads',
                file: 'packages/web/src/flows/app/smoke.e2e.ts',
                tests: [{ results: [{ status: 'passed', duration: 1234 }] }],
              },
            ],
          },
        ],
      });
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithJsonReport({ projectFolder, jsonContent });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          discoveredCount: 1,
          projectFolder,
          status: 'pass',
          errors: [],
          testFailures: [],
          onlyDiscovered: ['discovered.ts'],
          passingTests: [
            PassingTestStub({
              suitePath: 'packages/web/src/flows/app/smoke.e2e.ts',
              testName: 'packages/web/src/flows/app/smoke.e2e.ts › loads',
              durationMs: 1234,
            }),
          ],
          // Playwright reports per TEST and ward's slow-file verdict works in suites, so the
          // durations are rolled up. Without these the e2e check reports no timings at all and
          // `hasSlowFilesGuard` is blind to every browser spec in the repo.
          fileTimings: [
            FileTimingStub({
              filePath: 'packages/web/src/flows/app/smoke.e2e.ts',
              durationMs: 1234,
              testMs: 1234,
              slowestTestMs: 1234,
              testCount: 1,
            }),
          ],
          rawOutput: RawOutputStub({
            stdout: '',
            stderr: '',
            exitCode: 0,
          }),
        }),
      );
    });

    it('VALID: {two tests in one spec with unequal durations} => sums into testMs, takes the larger into slowestTestMs', async () => {
      const projectFolder = ProjectFolderStub();
      const jsonContent = JSON.stringify({
        suites: [
          {
            title: 'packages/web/src/flows/app/smoke.e2e.ts',
            specs: [
              {
                title: 'loads',
                file: 'packages/web/src/flows/app/smoke.e2e.ts',
                tests: [{ results: [{ status: 'passed', duration: 1200 }] }],
              },
              {
                title: 'renders',
                file: 'packages/web/src/flows/app/smoke.e2e.ts',
                tests: [{ results: [{ status: 'passed', duration: 800 }] }],
              },
            ],
          },
        ],
      });
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithJsonReport({ projectFolder, jsonContent });

      const result = await checkRunE2eBroker({ projectFolder, fileList: [] });

      // 1200 and 800 are unequal on purpose: testMs (2000, the sum) and slowestTestMs (1200, the
      // larger) must land on different numbers for this to prove the gate reads the max and not
      // the sum.
      expect(result.fileTimings).toStrictEqual([
        FileTimingStub({
          filePath: 'packages/web/src/flows/app/smoke.e2e.ts',
          durationMs: 2000,
          testMs: 2000,
          slowestTestMs: 1200,
          testCount: 2,
        }),
      ]);
    });

    it('VALID: {json report missing} => returns empty passingTests', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
      });

      expect(result.passingTests).toStrictEqual([]);
    });
  });

  describe('per-run isolation', () => {
    it('VALID: {a run allocated server port 40000} => names the playwright report after that port', async () => {
      // A report path fixed per package forces browser walks in one package to run one at a time,
      // because the second run overwrites the report the first is still reading. The port in this
      // name is what lets two of them run side by side.
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({ projectFolder, fileList: [] });

      expect(proxy.getSpawnedEnvValue({ key: 'PLAYWRIGHT_JSON_OUTPUT_NAME' })).toBe(
        `${projectFolder.path}/.ward-playwright-report-40000.json`,
      );
    });

    it('VALID: {OS assigns two non-adjacent ports} => passes the web port the OS gave, not serverPort + 1', async () => {
      // The proxy stages 40000 and 51244. Deriving the web port arithmetically would answer
      // 40001 here, and that derived port was never checked for being free.
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({ projectFolder, fileList: [] });

      expect({
        serverPort: proxy.getSpawnedEnvValue({ key: 'DUNGEONMASTER_PORT' }),
        webPort: proxy.getSpawnedEnvValue({ key: 'DUNGEONMASTER_WEB_PORT' }),
      }).toStrictEqual({ serverPort: '40000', webPort: '51244' });
    });
  });

  describe('the prebuilt bundle Playwright serves', () => {
    it('VALID: {a bundle already built for these inputs} => names it in DUNGEONMASTER_WEB_BUNDLE_DIR', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithBundle({ projectFolder });

      await checkRunE2eBroker({ projectFolder, fileList: [] });

      expect(proxy.getSpawnedEnvValue({ key: 'DUNGEONMASTER_WEB_BUNDLE_DIR' })).toBe(
        String(proxy.getBundleDir({ projectFolder })),
      );
    });

    // A package with no build script has no bundle to name. Pointing at a directory ward never
    // built would have `vite preview` serve nothing and every spec fail on a blank page, so the
    // variable is ABSENT and the consumer's config decides what to serve.
    it('VALID: {no build script in the package} => omits DUNGEONMASTER_WEB_BUNDLE_DIR entirely', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({ projectFolder, fileList: [] });

      expect(proxy.getSpawnedEnvValue({ key: 'DUNGEONMASTER_WEB_BUNDLE_DIR' })).toBe(undefined);
    });
  });

  describe('the vite cache this run created', () => {
    // Every run mints a ~39M dependency cache under a port the OS will never hand out again, and
    // vite evicts none of it. Left alone this repo reached 3,048 directories and about 50 GB.
    it('VALID: {a run allocated server port 40000} => removes node_modules/.vite-40000 after it', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({ projectFolder, fileList: [] });

      expect(proxy.getRemovedCachePaths({ projectFolder })).toStrictEqual([
        [`${projectFolder.path}/node_modules/.vite-40000`, { recursive: true, force: true }],
      ]);
    });

    // A --grep that matches nothing is normal in most packages, and it returns EARLY. Cleanup
    // written at the end of the broker would leak a full cache on every one of those runs, so this
    // asserts the removal happens above that return rather than after it.
    it('VALID: {testNamePattern matches no spec, so the broker returns early} => still removes the cache', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'matches-nothing',
      });

      expect({
        status: result.status,
        removed: proxy.getRemovedCachePaths({ projectFolder }),
      }).toStrictEqual({
        status: 'skip',
        removed: [
          [`${projectFolder.path}/node_modules/.vite-40000`, { recursive: true, force: true }],
        ],
      });
    });

    // A failing run's traces are the only record of why it failed, and they live in
    // test-results/<port>. The removal takes the cache and nothing else, so no pass/fail condition
    // exists here to get backwards.
    it('VALID: {the run FAILED} => removes the same one cache and nothing more', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupFail({ projectFolder, stdout: '1 failed' });

      await checkRunE2eBroker({ projectFolder, fileList: [] });

      expect(proxy.getRemovedCachePaths({ projectFolder })).toStrictEqual([
        [`${projectFolder.path}/node_modules/.vite-40000`, { recursive: true, force: true }],
      ]);
    });
  });

  describe('test name pattern', () => {
    it('VALID: {testNamePattern provided} => adds --grep and --pass-with-no-tests to playwright args', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'login',
      });

      const spawnedArgs: unknown = proxy.getSpawnedArgs();

      expect(spawnedArgs).toStrictEqual([
        'test',
        '--reporter=line,json',
        '--grep',
        'login',
        '--pass-with-no-tests',
      ]);
    });

    it('VALID: {testNamePattern matches no spec} => skips the package and records the pattern as unmatched', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPass({ projectFolder });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'XYZNONEXISTENT',
      });

      expect(result).toStrictEqual(
        ProjectResultStub({
          projectFolder,
          status: 'skip',
          testNamePatternMatch: 'unmatched',
          errors: [],
          testFailures: [],
          filesCount: 0,
          discoveredCount: 0,
          rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
        }),
      );
    });

    it('VALID: {testNamePattern matches a spec} => returns pass recording the pattern as matched', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = checkRunE2eBrokerProxy();
      proxy.setupPassWithOutput({
        projectFolder,
        stdout: '[1/1] [chromium] › discovered.e2e.ts:3:1 › login works',
      });

      const result = await checkRunE2eBroker({
        projectFolder,
        fileList: [],
        testNamePattern: 'login',
      });

      expect({
        status: result.status,
        testNamePatternMatch: result.testNamePatternMatch,
        filesCount: result.filesCount,
      }).toStrictEqual({
        status: 'pass',
        testNamePatternMatch: 'matched',
        filesCount: 1,
      });
    });
  });
});
