import type { StubArgument } from '@dungeonmaster/shared/@types';
import { testProjectContract } from './test-project-contract';
import type { TestProject } from './test-project-contract';
import { processOutputContract } from '../process-output/process-output-contract';
import { fileContentContract } from '../file-content/file-content-contract';
import { packageJsonContract } from '../package-json/package-json-contract';
import { execResultContract } from '../exec-result/exec-result-contract';
import type { FileName } from '../file-name/file-name-contract';

export const TestProjectStub = ({ ...props }: StubArgument<TestProject> = {}): TestProject => {
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
    ...testProjectContract.parse({
      projectPath: '/tmp/test-project-abc123',
      projectName: 'test-project-abc123',
      rootDir: '/tmp/test-project-abc123',
      ...dataProps,
    }),
    installDungeonmaster:
      installDungeonmaster ??
      ((): ReturnType<TestProject['installDungeonmaster']> =>
        processOutputContract.parse('Dungeonmaster installed')),
    hasCommand: hasCommand ?? ((): boolean => false),
    fileExists: fileExists ?? ((): boolean => false),
    readFile:
      readFile ?? ((): ReturnType<TestProject['readFile']> => fileContentContract.parse('')),
    writeFile: writeFile ?? ((): void => undefined),
    deleteFile: deleteFile ?? ((): void => undefined),
    getConfig: getConfig ?? ((): null => null),
    getPackageJson:
      getPackageJson ??
      ((): ReturnType<TestProject['getPackageJson']> =>
        packageJsonContract.parse({
          name: 'test-project-abc123',
          version: '1.0.0',
          scripts: {
            test: 'echo "test placeholder"',
            typecheck: 'echo "typecheck placeholder"',
          },
        })),
    getQuestFiles: getQuestFiles ?? ((): FileName[] => []),
    executeCommand:
      executeCommand ??
      ((): ReturnType<TestProject['executeCommand']> =>
        execResultContract.parse({
          stdout: '',
          stderr: '',
          exitCode: 0,
        })),
    cleanup: cleanup ?? ((): void => undefined),
  };
};
