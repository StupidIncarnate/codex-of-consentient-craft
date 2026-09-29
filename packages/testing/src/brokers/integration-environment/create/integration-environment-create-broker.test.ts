import { integrationEnvironmentCreateBroker } from './integration-environment-create-broker';
import { integrationEnvironmentCreateBrokerProxy } from './integration-environment-create-broker.proxy';
import { BaseNameStub } from '../../../contracts/base-name/base-name.stub';
import { CommandNameStub } from '../../../contracts/command-name/command-name.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';
import { Buffer } from '#gateway/node/buffer';

describe('integrationEnvironmentCreateBroker', () => {
  describe('project creation', () => {
    it('VALID: {baseName} => creates test project with tracking', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const baseName = BaseNameStub({ value: 'test-project' });

      const guild = integrationEnvironmentCreateBroker({ baseName });
      guild.cleanup();

      expect(guild.guildName).toMatch(/^test-project-[a-f0-9]{8}$/u);
    });

    it('VALID: {baseName} => writes a package.json carrying the project name and placeholder scripts', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      expect(proxy.getWrittenContents({ path: `${guild.guildPath}/package.json` })).toBe(
        JSON.stringify(
          {
            name: 'test-project-74657374',
            version: integrationEnvironmentStatics.packageJson.version,
            scripts: integrationEnvironmentStatics.packageJson.scripts,
          },
          null,
          integrationEnvironmentStatics.constants.jsonIndentSpaces,
        ),
      );
    });

    it('EMPTY: {options: {createPackageJson: false}} => writes no package.json', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });

      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
        options: { createPackageJson: false },
      });

      expect(proxy.getWrittenContents({ path: `${guild.guildPath}/package.json` })).toBe(undefined);
    });
  });

  describe('deleteFile', () => {
    it('VALID: {fileName exists} => unlinks the file inside the project', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupPathExists({ path: '/tmp/test-project-74657374/notes.txt' });
      proxy.setupUnlinkSucceeds({ path: '/tmp/test-project-74657374/notes.txt' });

      guild.deleteFile({ fileName: FileNameStub({ value: 'notes.txt' }) });

      expect(proxy.getUnlinkCalls({ path: '/tmp/test-project-74657374/notes.txt' })).toStrictEqual([
        ['/tmp/test-project-74657374/notes.txt'],
      ]);
    });

    it('EMPTY: {fileName missing} => unlinks nothing', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      guild.deleteFile({ fileName: FileNameStub({ value: 'notes.txt' }) });

      expect(proxy.getUnlinkCalls({ path: '/tmp/test-project-74657374/notes.txt' })).toStrictEqual(
        [],
      );
    });
  });

  describe('reading', () => {
    it('VALID: {fileName exists} => readFile returns its content and fileExists is true', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupFileContents({
        path: '/tmp/test-project-74657374/notes.txt',
        contents: 'on disk',
      });
      const fileName = FileNameStub({ value: 'notes.txt' });

      expect([guild.readFile({ fileName }), guild.fileExists({ fileName })]).toStrictEqual([
        'on disk',
        true,
      ]);
    });

    it('VALID: {package.json declares the script} => hasCommand returns true, and false for an absent script', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupFileContents({
        path: '/tmp/test-project-74657374/package.json',
        contents: JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: { test: 'jest' },
        }),
      });

      expect([
        guild.hasCommand({ command: CommandNameStub({ value: 'test' }) }),
        guild.hasCommand({ command: CommandNameStub({ value: 'build' }) }),
      ]).toStrictEqual([true, false]);
    });
  });

  describe('cleanup', () => {
    it('VALID: {project dir exists} => removes it recursively and forcibly', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupPathExists({ path: guild.guildPath });
      proxy.setupRemoveSucceeds({ path: guild.guildPath });

      guild.cleanup();

      expect(proxy.getRemoveCalls({ path: guild.guildPath })).toStrictEqual([
        ['/tmp/test-project-74657374', { recursive: true, force: true }],
      ]);
    });

    it('EMPTY: {project dir already gone} => removes nothing', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      guild.cleanup();

      expect(proxy.getRemoveCalls({ path: guild.guildPath })).toStrictEqual([]);
    });
  });

  describe('getQuestFiles', () => {
    it('VALID: {no subdir} => returns the markdown files under dungeonmaster/', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupDirEntries({
        path: '/tmp/test-project-74657374/dungeonmaster',
        names: ['quest-a.md', 'quest-b.json', 'quest-c.md'],
      });

      const result = guild.getQuestFiles({});

      expect(result).toStrictEqual(['dungeonmaster/quest-a.md', 'dungeonmaster/quest-c.md']);
    });

    it('VALID: {subdir} => returns the json files under dungeonmaster/<subdir>', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupDirEntries({
        path: '/tmp/test-project-74657374/dungeonmaster/active',
        names: ['quest-a.md', 'quest-b.json'],
      });

      const result = guild.getQuestFiles({ subdir: FileNameStub({ value: 'active' }) });

      expect(result).toStrictEqual(['dungeonmaster/active/quest-b.json']);
    });

    it('EMPTY: {dungeonmaster/ missing} => returns no files', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      const result = guild.getQuestFiles({});

      expect(result).toStrictEqual([]);
    });
  });

  describe('executeCommand', () => {
    it('VALID: {command exits 0} => stdout carries its output, exitCode 0', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupCommandSucceeds({ command: 'sh', stdout: 'all good' });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      expect(
        guild.executeCommand({ command: CommandNameStub({ value: 'npm test' }) }),
      ).toStrictEqual({
        stdout: 'all good',
        stderr: '',
        exitCode: 0,
      });
    });

    it('ERROR: {command exits 3} => its combined output is stderr, exitCode 3', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupCommandExits({ command: 'sh', status: 3, stdout: 'out ', stderr: 'err' });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      expect(
        guild.executeCommand({ command: CommandNameStub({ value: 'npm test' }) }),
      ).toStrictEqual({
        stdout: '',
        stderr: 'out err',
        exitCode: 3,
      });
    });
  });

  describe('installDungeonmaster', () => {
    it('VALID: {npm run install-dungeonmaster exits 0} => returns its output', async () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupInstallScriptResult({ exitCode: 0, output: 'installed' });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      await expect(guild.installDungeonmaster()).resolves.toBe('installed');
    });

    it('VALID: {npm run install-dungeonmaster exits 1} => returns its output', async () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupInstallScriptResult({ exitCode: 1, output: 'npm error missing script' });
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      await expect(guild.installDungeonmaster()).resolves.toBe('npm error missing script');
    });

    it('ERROR: {npm not installed} => returns the not-installed message', async () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();
      proxy.setupRandomBytes({ bytes: Buffer.from('test') });
      proxy.setupWritableUnder({ root: integrationEnvironmentStatics.paths.baseDir });
      proxy.setupNpmNotInstalled();
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      await expect(guild.installDungeonmaster()).resolves.toBe(
        'npm run install-dungeonmaster could not start in /tmp/test-project-74657374: "npm" never started: ENOENT: open \'npm\'',
      );
    });
  });
});
