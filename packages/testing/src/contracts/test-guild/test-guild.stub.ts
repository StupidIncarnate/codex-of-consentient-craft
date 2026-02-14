import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testGuildContract } from './test-guild-contract';
import type { TestGuild } from './test-guild-contract';
import { processOutputContract } from '../process-output/process-output-contract';
import { fileContentContract } from '../file-content/file-content-contract';
import { packageJsonContract } from '../package-json/package-json-contract';
import { execResultContract } from '../exec-result/exec-result-contract';
import type { FileName } from '../file-name/file-name-contract';

export const TestGuildStub = ({ ...props }: StubArgument<TestGuild> = {}): TestGuild => {
  const {
    installDungeonmaster,
    hasCommand,
    fileExists,
    readFile,
    writeFile,
    deleteFile,
    getConfig,
    getPackageJson,
    getQuestFiles,
    executeCommand,
    cleanup,
    ...dataProps
  } = props;

  return {
    ...testGuildContract.parse({
      guildPath: '/tmp/test-guild-abc123',
      guildName: 'test-guild-abc123',
      rootDir: '/tmp/test-guild-abc123',
      ...dataProps,
    }),
    installDungeonmaster:
      installDungeonmaster ??
      ((): ReturnType<TestGuild['installDungeonmaster']> =>
        processOutputContract.parse('Dungeonmaster installed')),
    hasCommand: hasCommand ?? ((): boolean => false),
    fileExists: fileExists ?? ((): boolean => false),
    readFile: readFile ?? ((): ReturnType<TestGuild['readFile']> => fileContentContract.parse('')),
    writeFile: writeFile ?? ((): void => undefined),
    deleteFile: deleteFile ?? ((): void => undefined),
    getConfig: getConfig ?? ((): null => null),
    getPackageJson:
      getPackageJson ??
      ((): ReturnType<TestGuild['getPackageJson']> =>
        packageJsonContract.parse({
          name: 'test-guild-abc123',
          version: '1.0.0',
          scripts: {
            test: 'echo "test placeholder"',
            typecheck: 'echo "typecheck placeholder"',
          },
        })),
    getQuestFiles: getQuestFiles ?? ((): FileName[] => []),
    executeCommand:
      executeCommand ??
      ((): ReturnType<TestGuild['executeCommand']> =>
        execResultContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 0,
        })),
    cleanup: cleanup ?? ((): void => undefined),
  };
};
