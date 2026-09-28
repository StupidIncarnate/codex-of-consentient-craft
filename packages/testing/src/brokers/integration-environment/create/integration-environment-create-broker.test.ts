import { integrationEnvironmentCreateBroker } from './integration-environment-create-broker';
import { integrationEnvironmentCreateBrokerProxy } from './integration-environment-create-broker.proxy';
import { BaseNameStub } from '../../../contracts/base-name/base-name.stub';
import { CommandNameStub } from '../../../contracts/command-name/command-name.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { integrationEnvironmentStatics } from '../../../statics/integration-environment/integration-environment-statics';

describe('integrationEnvironmentCreateBroker', () => {
  describe('project creation', () => {
    it('VALID: {baseName} => creates test project with tracking', () => {
      integrationEnvironmentCreateBrokerProxy();
      const baseName = BaseNameStub({ value: 'test-project' });

      const guild = integrationEnvironmentCreateBroker({ baseName });
      guild.cleanup();

      expect(guild.guildName).toMatch(/^test-project-[a-f0-9]{8}$/u);
    });

    it('VALID: {baseName} => writes a package.json carrying the project name and placeholder scripts', () => {
      const proxy = integrationEnvironmentCreateBrokerProxy();

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
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });
      proxy.setupFileContents({
        path: '/tmp/test-project-74657374/package.json',
        contents: JSON.stringify({ scripts: { test: 'jest' } }),
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
      integrationEnvironmentCreateBrokerProxy();
      const guild = integrationEnvironmentCreateBroker({
        baseName: BaseNameStub({ value: 'test-project' }),
      });

      const result = guild.getQuestFiles({});

      expect(result).toStrictEqual([]);
    });
  });
});
