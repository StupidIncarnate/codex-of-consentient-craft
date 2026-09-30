import { locationsStatics } from '@dungeonmaster/shared/statics';

import { installTestbedCreateBroker } from './install-testbed-create-broker';
import { installTestbedCreateBrokerProxy } from './install-testbed-create-broker.proxy';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import { Buffer } from '#gateway/node/buffer';

describe('installTestbedCreateBroker', () => {
  describe('testbed creation', () => {
    it('VALID: creates testbed with required pre-install files', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const baseName = 'test-install';

      const testbed = installTestbedCreateBroker({ baseName });

      expect({
        guildPath: testbed.guildPath,
        packageJson: proxy.getWrittenContents({ path: `${testbed.guildPath}/package.json` }),
        projectDirCalls: proxy.getEnsuredDirCalls({ path: testbed.guildPath }),
        claudeDirCalls: proxy.getEnsuredDirCalls({
          path: `${testbed.guildPath}/${locationsStatics.repoRoot.claude.dir}`,
        }),
      }).toStrictEqual({
        guildPath: '/tmp/test-install-74657374',
        packageJson: JSON.stringify(
          {
            name: 'test-install-74657374',
            version: integrationEnvironmentStatics.packageJson.version,
          },
          null,
          integrationEnvironmentStatics.constants.jsonIndentSpaces,
        ),
        projectDirCalls: [['/tmp/test-install-74657374', { recursive: true }]],
        claudeDirCalls: [
          [
            `/tmp/test-install-74657374/${locationsStatics.repoRoot.claude.dir}`,
            { recursive: true },
          ],
        ],
      });
    });

    it('VALID: {baseDir: custom path} => creates testbed in custom directory', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const customBaseDir = '/tmp/custom-base-test';

      const testbed = installTestbedCreateBroker({
        baseName: 'custom-base',
        baseDir: customBaseDir,
      });

      expect({
        guildPath: testbed.guildPath,
        projectDirCalls: proxy.getEnsuredDirCalls({ path: testbed.guildPath }),
      }).toStrictEqual({
        guildPath: '/tmp/custom-base-test/custom-base-74657374',
        projectDirCalls: [['/tmp/custom-base-test/custom-base-74657374', { recursive: true }]],
      });
    });

    it('VALID: {project dir already exists} => does not create it again', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupPathExists({ path: '/tmp/test-existing-74657374' });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-existing',
      });

      expect(proxy.getEnsuredDirCalls({ path: testbed.guildPath })).toStrictEqual([]);
    });
  });

  describe('file operations', () => {
    it('VALID: testbed has writeFile and readFile methods', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-write',
      });

      expect(testbed).toStrictEqual({
        guildPath: '/tmp/test-write-74657374',
        dungeonmasterPath: expect.stringMatching(/^\/[a-zA-Z0-9_./-]+$/u),
        cleanup: expect.any(Function),
        writeFile: expect.any(Function),
        readFile: expect.any(Function),
        createSymlink: expect.any(Function),
        listDir: expect.any(Function),
        getClaudeSettings: expect.any(Function),
        getMcpConfig: expect.any(Function),
        getDungeonmasterConfig: expect.any(Function),
        getEslintConfig: expect.any(Function),
        runInitCommand: expect.any(Function),
      });
    });

    it('VALID: {writeFile into a missing subdirectory} => creates the directory, then writes the content', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-write',
      });

      testbed.writeFile({
        relativePath: 'deep/dir/file.txt',
        content: 'hello',
      });

      expect({
        dirCalls: proxy.getEnsuredDirCalls({ path: '/tmp/test-write-74657374/deep/dir' }),
        written: proxy.getWrittenContents({ path: '/tmp/test-write-74657374/deep/dir/file.txt' }),
      }).toStrictEqual({
        dirCalls: [['/tmp/test-write-74657374/deep/dir', { recursive: true }]],
        written: 'hello',
      });
    });

    it('VALID: {writeFile into an existing subdirectory} => writes without creating the directory', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-write',
      });
      proxy.setupPathExists({ path: '/tmp/test-write-74657374/deep/dir' });

      testbed.writeFile({
        relativePath: 'deep/dir/file.txt',
        content: 'hello',
      });

      expect({
        dirCalls: proxy.getEnsuredDirCalls({ path: '/tmp/test-write-74657374/deep/dir' }),
        written: proxy.getWrittenContents({ path: '/tmp/test-write-74657374/deep/dir/file.txt' }),
      }).toStrictEqual({ dirCalls: [], written: 'hello' });
    });

    it('VALID: {readFile of an existing file} => returns its content', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-read',
      });
      proxy.setupFileContents({ path: '/tmp/test-read-74657374/notes.txt', contents: 'on disk' });

      const result = testbed.readFile({ relativePath: 'notes.txt' });

      expect(result).toBe('on disk');
    });

    it('EMPTY: {readFile of a missing file} => returns null', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-read',
      });

      const result = testbed.readFile({ relativePath: 'notes.txt' });

      expect(result).toBe(null);
    });
  });

  describe('createSymlink', () => {
    it('VALID: {relativePath, targetPath} => creates the parent directory, then a dir symlink at the path', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-link',
      });
      proxy.setupSymlinkSucceeds({
        target: '/tmp/target-dir',
        path: '/tmp/test-link-74657374/nested/.legacy-link',
      });

      testbed.createSymlink({
        relativePath: 'nested/.legacy-link',
        targetPath: '/tmp/target-dir',
      });

      expect({
        dirCalls: proxy.getEnsuredDirCalls({ path: '/tmp/test-link-74657374/nested' }),
        symlinkCalls: proxy.getSymlinkCalls({
          target: '/tmp/target-dir',
          path: '/tmp/test-link-74657374/nested/.legacy-link',
        }),
      }).toStrictEqual({
        dirCalls: [['/tmp/test-link-74657374/nested', { recursive: true }]],
        symlinkCalls: [['/tmp/target-dir', '/tmp/test-link-74657374/nested/.legacy-link', 'dir']],
      });
    });
  });

  describe('cleanup', () => {
    it('VALID: {project dir exists} => removes it recursively and forcibly', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-clean',
      });
      proxy.setupPathExists({ path: testbed.guildPath });
      proxy.setupRemoveSucceeds({ path: testbed.guildPath });

      testbed.cleanup();

      expect(proxy.getRemoveCalls({ path: testbed.guildPath })).toStrictEqual([
        ['/tmp/test-clean-74657374', { recursive: true, force: true }],
      ]);
    });

    it('EMPTY: {project dir already gone} => removes nothing', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-clean',
      });

      testbed.cleanup();

      expect(proxy.getRemoveCalls({ path: testbed.guildPath })).toStrictEqual([]);
    });
  });

  describe('listDir', () => {
    it('EMPTY: {relativePath: does not exist} => returns null', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-listdir',
      });

      const result = testbed.listDir({
        relativePath: 'no-such-dir',
      });

      expect(result).toBe(null);
    });

    it('VALID: {relativePath: dir with entries} => returns the entry names sorted', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-listdir',
      });
      proxy.setupDirEntries({
        path: '/tmp/test-listdir-74657374/src',
        names: ['b.txt', 'c.txt', 'a.txt'],
      });

      const result = testbed.listDir({ relativePath: 'src' });

      expect(result).toStrictEqual(['a.txt', 'b.txt', 'c.txt']);
    });
  });

  describe('config file getters', () => {
    it('VALID: getClaudeSettings returns the parsed settings.json when it exists', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-settings',
      });
      proxy.setupFileContents({
        path: `/tmp/test-settings-74657374/${locationsStatics.repoRoot.claude.dir}/${locationsStatics.repoRoot.claude.settings}`,
        contents: '{"hooks":{}}',
      });

      const result = testbed.getClaudeSettings();

      expect(result).toStrictEqual({ hooks: {} });
    });

    it('VALID: getClaudeSettings returns null when settings.json does not exist', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-settings',
      });

      const result = testbed.getClaudeSettings();

      expect(result).toBe(null);
    });

    it('VALID: getMcpConfig returns the parsed .mcp.json when it exists', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-mcp',
      });
      proxy.setupFileContents({
        path: `/tmp/test-mcp-74657374/${locationsStatics.repoRoot.mcpJson}`,
        contents: '{"mcpServers":{"dungeonmaster":{"command":"node"}}}',
      });

      const result = testbed.getMcpConfig();

      expect(result).toStrictEqual({ mcpServers: { dungeonmaster: { command: 'node' } } });
    });

    it('VALID: getMcpConfig returns null when .mcp.json does not exist', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-mcp',
      });

      const result = testbed.getMcpConfig();

      expect(result).toBe(null);
    });

    it('VALID: getDungeonmasterConfig returns null when .dungeonmaster does not exist', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-config',
      });

      const result = testbed.getDungeonmasterConfig();

      expect(result).toBe(null);
    });

    it('VALID: getEslintConfig returns null when eslint.config.js does not exist', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const testbed = installTestbedCreateBroker({
        baseName: 'test-eslint',
      });

      const result = testbed.getEslintConfig();

      expect(result).toBe(null);
    });
  });

  describe('runInitCommand', () => {
    it('VALID: {dungeonmaster init exits 0} => exitCode 0 and its output as stdout', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupCommandSucceeds({ command: 'dungeonmaster', stdout: 'initialised' });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-init',
      });

      expect(testbed.runInitCommand()).toStrictEqual({
        exitCode: 0,
        stdout: 'initialised',
        stderr: '',
      });
    });

    it('ERROR: {dungeonmaster init exits 2} => exitCode 2 and its output as stderr', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupCommandExits({
        command: 'dungeonmaster',
        status: 2,
        stdout: 'partial ',
        stderr: 'boom',
      });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-init',
      });

      expect(testbed.runInitCommand()).toStrictEqual({
        exitCode: 2,
        stdout: '',
        stderr: 'partial boom',
      });
    });

    it('ERROR: {dungeonmaster not installed} => exitCode 1 and the spawn failure as stderr', () => {
      const proxy = installTestbedCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupCommandNotFound({ command: 'dungeonmaster', code: 'ENOENT' });
      const testbed = installTestbedCreateBroker({
        baseName: 'test-init',
      });

      expect(testbed.runInitCommand()).toStrictEqual({
        exitCode: 1,
        stdout: '',
        stderr: '"dungeonmaster" never started: spawn dungeonmaster ENOENT',
      });
    });
  });
});
