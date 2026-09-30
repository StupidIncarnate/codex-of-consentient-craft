
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ScanConfigStub } from '../../../contracts/scan-config/scan-config.stub';
import { scanRunBroker } from './scan-run-broker';
import { scanRunBrokerProxy } from './scan-run-broker.proxy';

const rootPath = '/project';
const rule = '@dungeonmaster/ban-workspace-export-mocks';
const ward = ProjectFolderStub({ name: '@dungeonmaster/ward', path: '/project/packages/ward' });
const shared = ProjectFolderStub({
  name: '@dungeonmaster/shared',
  path: '/project/packages/shared',
});
const hooks = ProjectFolderStub({ name: '@dungeonmaster/hooks', path: '/project/packages/hooks' });

const hitsIn = ({ file, lines }: { file: string; lines: number[] }): unknown => ({
  filePath: `/project/${file}`,
  messages: lines.map((line) => ({
    ruleId: '@dungeonmaster/ban-workspace-export-mocks',
    line,
    message: 'Mocked export',
  })),
});

describe('scanRunBroker', () => {
  describe('no paths', () => {
    it('VALID: {three packages, two with hits} => reports every package in workspace order, each scanned whole', async () => {
      const proxy = scanRunBrokerProxy();
      proxy.setupWorkspaces({
        dirs: ['ward', 'shared', 'hooks'],
        packageNames: ['@dungeonmaster/ward', '@dungeonmaster/shared', '@dungeonmaster/hooks'],
      });
      proxy.setupPackageExit({
        projectFolder: ward,
        exitCode: 1,
        stdout: JSON.stringify([
          hitsIn({ file: 'packages/ward/src/b.ts', lines: [7] }),
          hitsIn({ file: 'packages/ward/src/a.ts', lines: [3, 1] }),
        ]),
      });
      proxy.setupPackageExit({ projectFolder: shared, exitCode: 0, stdout: '[]' });
      proxy.setupPackageExit({
        projectFolder: hooks,
        exitCode: 1,
        stdout: JSON.stringify([hitsIn({ file: 'packages/hooks/src/c.ts', lines: [5] })]),
      });

      const result = await scanRunBroker({ config: ScanConfigStub({ rule }), rootPath });

      expect(proxy.getConfigRemovals()).toStrictEqual([
        ['/tmp/ward-scan-abc123', { recursive: true, force: true }],
      ]);
      expect(result).toStrictEqual({
        rule: '@dungeonmaster/ban-workspace-export-mocks',
        packages: [
          {
            name: '@dungeonmaster/ward',
            violations: 3,
            batches: [
              [
                { file: 'packages/ward/src/a.ts', line: 1, message: 'Mocked export' },
                { file: 'packages/ward/src/a.ts', line: 3, message: 'Mocked export' },
                { file: 'packages/ward/src/b.ts', line: 7, message: 'Mocked export' },
              ],
            ],
          },
          { name: '@dungeonmaster/shared', violations: 0, batches: [] },
          {
            name: '@dungeonmaster/hooks',
            violations: 1,
            batches: [[{ file: 'packages/hooks/src/c.ts', line: 5, message: 'Mocked export' }]],
          },
        ],
      });
    });
  });

  describe('paths given', () => {
    it('VALID: {one file path in ward} => scans only ward, handing eslint that file', async () => {
      const proxy = scanRunBrokerProxy();
      proxy.setupWorkspaces({
        dirs: ['ward', 'shared'],
        packageNames: ['@dungeonmaster/ward', '@dungeonmaster/shared'],
      });
      proxy.setupPackageExit({ projectFolder: ward, exitCode: 0, stdout: '[]' });

      const result = await scanRunBroker({
        config: ScanConfigStub({
          rule,
          paths: ['packages/ward/src/a.ts'],
        }),
        rootPath,
      });

      expect({ result, calls: proxy.getEslintArgs({ projectFolder: ward }) }).toStrictEqual({
        result: {
          rule: '@dungeonmaster/ban-workspace-export-mocks',
          packages: [{ name: '@dungeonmaster/ward', violations: 0, batches: [] }],
        },
        calls: [
          [
            '--config',
            '/tmp/ward-scan-abc123/eslint.scan.config.cjs',
            '--format',
            'json',
            '--no-warn-ignored',
            'packages/ward/src/a.ts',
          ],
        ],
      });
    });
  });

  describe('failures', () => {
    it('ERROR: {root declares no workspaces} => throws naming the root', async () => {
      const proxy = scanRunBrokerProxy();
      proxy.setupNoWorkspaces();

      await expect(scanRunBroker({ config: ScanConfigStub({ rule }), rootPath })).rejects.toThrow(
        /^scan needs an npm-workspaces root; \/project declares none$/u,
      );
    });

    it('ERROR: {one package cannot be scanned} => rejects with that package failure and still removes the wrapper directory', async () => {
      const proxy = scanRunBrokerProxy();
      proxy.setupWorkspaces({ dirs: ['ward'], packageNames: ['@dungeonmaster/ward'] });
      proxy.setupPackageExit({ projectFolder: ward, exitCode: 2, stdout: 'config broke' });

      const outcome = await scanRunBroker({ config: ScanConfigStub({ rule }), rootPath }).catch(
        (error: unknown) => String(error),
      );

      expect({ outcome, removals: proxy.getConfigRemovals() }).toStrictEqual({
        outcome:
          'Error: Scan of @dungeonmaster/ward for @dungeonmaster/ban-workspace-export-mocks failed (exit 2, signal null): config broke',
        removals: [['/tmp/ward-scan-abc123', { recursive: true, force: true }]],
      });
    });
  });
});
