import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { WardConfigStub } from '../../../contracts/ward-config/ward-config.stub';

import { singlePackageLayerBroker } from './single-package-layer-broker';
import { singlePackageLayerBrokerProxy } from './single-package-layer-broker.proxy';

describe('singlePackageLayerBroker', () => {
  describe('all checks pass', () => {
    it('VALID: {all checks pass, no fileList} => returns WardResult with pass checks', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupAllChecksPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub();

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.checks.every((c) => c.status === 'pass')).toBe(true);
      expect(result.runId).toBe('1739625600000-a38e');
    });
  });

  describe('progress output', () => {
    it('VALID: {lint passes} => writes running then PASS to stderr', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['lint'] });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 running...\r',
        '\x1b[Klint        ward                 PASS  0 files, 0 discovered (0.0s)\n',
      ]);
    });

    it('VALID: {lint fails with errors} => writes FAIL with error count to stderr', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyFail({
        projectFolder,
        stdout: JSON.stringify([
          {
            filePath: '/home/user/project/packages/ward/src/index.ts',
            messages: [
              { ruleId: 'no-unused-vars', message: 'x is unused', line: 1, column: 1, severity: 2 },
            ],
            errorCount: 1,
            warningCount: 0,
          },
        ]),
      });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['lint'] });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'lint        ward                 running...\r',
        '\x1b[Klint        ward                 FAIL  1 files, 1 errors, 1 discovered (0.0s)\n',
      ]);
    });

    it('VALID: {e2e skips, package not e2e-eligible} => shows skip label on stderr', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupE2eOnlySkip({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['e2e'] });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'e2e         ward                 running...\r',
        '\x1b[Ke2e         ward                 skip (0.0s)\n',
      ]);
    });

    // Jest's report never reached ward, so filesCount is the default 0 against five discovered
    // files. That is a crash, not five unrun tests: reading it as a DISCOVERY MISMATCH listed the
    // very file the caller asked for under "only discovered".
    it('ERROR: {integration crashes, no jest report, files discovered} => labels the line CRASH and lists no discovery diff', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupIntegrationOnlyCrash({
        projectFolder,
        discoveredFiles: [
          '/home/user/project/packages/ward/src/a.integration.test.ts',
          '/home/user/project/packages/ward/src/b.integration.test.ts',
        ],
        stdout: '[OK] install log with no jest report',
      });

      const rootPath = '/project';
      const config = WardConfigStub({
        only: ['integration'],
        passthrough: ['src/a.integration.test.ts'],
      });

      await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(proxy.getStderrCalls()).toStrictEqual([
        'integration ward                 running...\r',
        '\x1b[Kintegration ward                 FAIL  0 files, 2 discovered  CRASH (0.0s)\n',
      ]);
    });
  });

  describe('the filters it records on the result', () => {
    // `passthrough` CANNOT SPEAK FOR ITSELF. `gitScopeLayerBroker` writes a `--committed` /
    // `--uncommitted` diff into that same field, so a saved result carrying the list alone reads
    // back as a list the caller typed — and `isCallerFileScopeGuard`, which the summary and the
    // detail both narrow on, would then print a whole unbounded diff's failures in full and drop a
    // `not run` section that was the real finding.
    it('VALID: {uncommitted run} => records the uncommitted flag beside the resolved paths', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({
        only: ['lint'],
        uncommitted: true,
        passthrough: ['src/a.ts'],
      });

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.filters).toStrictEqual({
        only: ['lint'],
        uncommitted: true,
        passthrough: ['src/a.ts'],
      });
    });

    it('VALID: {committed run} => records the committed flag beside the resolved paths', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({
        only: ['lint'],
        committed: true,
        passthrough: ['src/a.ts'],
      });

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.filters).toStrictEqual({
        only: ['lint'],
        committed: true,
        passthrough: ['src/a.ts'],
      });
    });

    it('VALID: {caller-typed file list} => records the paths and neither git flag', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['lint'], passthrough: ['src/a.ts'] });

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.filters).toStrictEqual({ only: ['lint'], passthrough: ['src/a.ts'] });
    });

    it('EMPTY: {no scope of any kind} => records only the check filter', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['lint'] });

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.filters).toStrictEqual({ only: ['lint'] });
    });
  });

  describe('platformDedupeProjectResult', () => {
    it('VALID: {a failing platformDedupeProjectResult, lint otherwise passes} => folds it into lint and flips the check to fail', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['lint'] });
      const platformDedupeProjectResult = ProjectResultStub({
        projectFolder: { name: '(platform + dedupe)', path: '/project' },
        status: 'fail',
        errors: [
          {
            filePath: 'web',
            line: 0,
            column: 0,
            message: 'a platform crossing',
            severity: 'error',
          },
        ],
      });

      const result = await singlePackageLayerBroker({
        config,
        projectFolder,
        rootPath,
        platformDedupeProjectResult,
      });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'fail',
          durationMs: 0,
          projectResults: [
            {
              projectFolder,
              status: 'pass',
              errors: [],
              elsewhereErrors: [],
              testFailures: [],
              filesCount: 0,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '[]', stderr: '', exitCode: 0, signal: null },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
            },
            platformDedupeProjectResult,
          ],
        },
      ]);
    });

    it('EMPTY: {no platformDedupeProjectResult} => leaves the lint result exactly as the checks alone produced it', async () => {
      const projectFolder = ProjectFolderStub();
      const proxy = singlePackageLayerBrokerProxy();
      proxy.setupLintOnlyPass({ projectFolder });

      const rootPath = '/project';
      const config = WardConfigStub({ only: ['lint'] });

      const result = await singlePackageLayerBroker({ config, projectFolder, rootPath });

      expect(result.checks).toStrictEqual([
        {
          checkType: 'lint',
          status: 'pass',
          durationMs: 0,
          projectResults: [
            {
              projectFolder,
              status: 'pass',
              errors: [],
              elsewhereErrors: [],
              testFailures: [],
              filesCount: 0,
              discoveredCount: 0,
              onlyDiscovered: [],
              onlyProcessed: [],
              rawOutput: { stdout: '[]', stderr: '', exitCode: 0, signal: null },
              fileTimings: [],
              passingTests: [],
              openHandles: [],
              durationMs: 0,
            },
          ],
        },
      ]);
    });
  });
});
