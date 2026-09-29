import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';

import { ScanConfigFileStub } from '../../../contracts/scan-config-file/scan-config-file.stub';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ScanRuleNameStub } from '../../../contracts/scan-rule-name/scan-rule-name.stub';
import { scanPackageBroker } from './scan-package-broker';
import { scanPackageBrokerProxy } from './scan-package-broker.proxy';

const rootPath = AbsoluteFilePathStub({ value: '/repo' });
const projectFolder = ProjectFolderStub({
  name: '@dungeonmaster/ward',
  path: '/repo/packages/ward',
});
const rule = ScanRuleNameStub({ value: '@dungeonmaster/ban-workspace-export-mocks' });
const configFile = ScanConfigFileStub();

describe('scanPackageBroker', () => {
  describe('the scan ran', () => {
    it('VALID: {exit 1, hits in three files plus another rule} => returns the rule hits batched by file, other rules dropped', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupExit({
        projectFolder,
        rootPath,
        exitCode: 1,
        stdout: JSON.stringify([
          {
            filePath: '/repo/packages/ward/src/b.ts',
            messages: [
              {
                ruleId: '@dungeonmaster/ban-workspace-export-mocks',
                line: 4,
                message: 'Mocked export',
              },
              { ruleId: 'no-console', line: 1, message: 'Other rule' },
            ],
          },
          {
            filePath: '/repo/packages/ward/src/a.ts',
            messages: [
              {
                ruleId: '@dungeonmaster/ban-workspace-export-mocks',
                line: 9,
                message: 'Mocked export',
              },
              {
                ruleId: '@dungeonmaster/ban-workspace-export-mocks',
                line: 2,
                message: 'Mocked export',
              },
            ],
          },
          {
            filePath: '/repo/packages/ward/src/c.ts',
            messages: [
              {
                ruleId: '@dungeonmaster/ban-workspace-export-mocks',
                line: 6,
                message: 'Mocked export',
              },
            ],
          },
        ]),
        stderr: '',
      });

      const result = await scanPackageBroker({
        projectFolder,
        rootPath,
        rule,
        targets: [],
        configFile,
      });

      expect(result).toStrictEqual({
        name: '@dungeonmaster/ward',
        violations: 4,
        batches: [
          [
            { file: 'packages/ward/src/a.ts', line: 2, message: 'Mocked export' },
            { file: 'packages/ward/src/a.ts', line: 9, message: 'Mocked export' },
            { file: 'packages/ward/src/b.ts', line: 4, message: 'Mocked export' },
            { file: 'packages/ward/src/c.ts', line: 6, message: 'Mocked export' },
          ],
        ],
      });
    });

    it('VALID: {exit 1, no targets} => runs eslint from the root over the whole package under the wrapper config, json format, never --fix', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupExit({ projectFolder, rootPath, exitCode: 1, stdout: '[]', stderr: '' });

      await scanPackageBroker({ projectFolder, rootPath, rule, targets: [], configFile });

      expect(proxy.getEslintArgs({ projectFolder })).toStrictEqual([
        [
          '--config',
          '/tmp/ward-scan-abc123/eslint.scan.config.cjs',
          '--format',
          'json',
          '--no-warn-ignored',
          'packages/ward',
        ],
      ]);
    });

    it('VALID: {exit 0, two targets} => returns an empty result and hands eslint only the targets', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupExit({ projectFolder, rootPath, exitCode: 0, stdout: '[]', stderr: '' });

      const result = await scanPackageBroker({
        projectFolder,
        rootPath,
        rule,
        targets: ['src/a.ts', 'src/b.ts'],
        configFile,
      });

      expect({ result, calls: proxy.getEslintArgs({ projectFolder }) }).toStrictEqual({
        result: { name: '@dungeonmaster/ward', violations: 0, batches: [] },
        calls: [
          [
            '--config',
            '/tmp/ward-scan-abc123/eslint.scan.config.cjs',
            '--format',
            'json',
            '--no-warn-ignored',
            'packages/ward/src/a.ts',
            'packages/ward/src/b.ts',
          ],
        ],
      });
    });
  });

  describe('the scan failed', () => {
    it('ERROR: {exit 2, eslint could not load the rule} => throws naming package, rule, exit and the output', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupExit({
        projectFolder,
        rootPath,
        exitCode: 2,
        stdout: 'Could not find "nope" in plugin "@dungeonmaster".',
        stderr: '',
      });

      await expect(
        scanPackageBroker({ projectFolder, rootPath, rule, targets: [], configFile }),
      ).rejects.toThrow(
        /^Scan of @dungeonmaster\/ward for @dungeonmaster\/ban-workspace-export-mocks failed \(exit 2, signal null\): Could not find "nope" in plugin "@dungeonmaster"\.$/u,
      );
    });

    it('ERROR: {killed by SIGKILL} => throws naming the signal', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupSignalKill({ projectFolder, rootPath, stdout: '' });

      await expect(
        scanPackageBroker({ projectFolder, rootPath, rule, targets: [], configFile }),
      ).rejects.toThrow(
        /^Scan of @dungeonmaster\/ward for @dungeonmaster\/ban-workspace-export-mocks failed \(exit 1, signal SIGKILL\): $/u,
      );
    });

    it('ERROR: {exit 1 with non-JSON output} => throws that the output was not a JSON report', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupExit({
        projectFolder,
        rootPath,
        exitCode: 1,
        stdout: 'plain text failure',
        stderr: '',
      });

      await expect(
        scanPackageBroker({ projectFolder, rootPath, rule, targets: [], configFile }),
      ).rejects.toThrow(/^ESLint output was not a JSON report: plain text failure$/u);
    });

    it('ERROR: {eslint binary cannot be spawned} => throws that the scan could not start it', async () => {
      const proxy = scanPackageBrokerProxy();
      proxy.setupSpawnError({ projectFolder, rootPath, error: new Error('spawn eslint ENOENT') });

      await expect(
        scanPackageBroker({ projectFolder, rootPath, rule, targets: [], configFile }),
      ).rejects.toThrow(
        /^Scan of @dungeonmaster\/ward could not start \/repo\/packages\/ward\/node_modules\/\.bin\/eslint: /u,
      );
    });
  });
});
