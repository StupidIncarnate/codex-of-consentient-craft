import type { StubArgument } from '@questmaestro/shared/@types';
import { testProjectContract } from './test-project-contract';
import type { TestProject } from './test-project-contract';

export const TestProjectStub = ({ ...props }: StubArgument<TestProject> = {}): TestProject => {
  const {
    installQuestmaestro,
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
    installQuestmaestro: installQuestmaestro ?? ((): string => 'Questmaestro installed'),
    hasCommand: hasCommand ?? ((): boolean => false),
    fileExists: fileExists ?? ((): boolean => false),
    readFile: readFile ?? ((): string => ''),
    writeFile: writeFile ?? ((): void => undefined),
    deleteFile: deleteFile ?? ((): void => undefined),
    getConfig: getConfig ?? ((): null => null),
    getPackageJson:
      getPackageJson ??
      ((): { name: string; version: string; scripts: { test: string; typecheck: string } } => ({
        name: 'test-project-abc123',
        version: '1.0.0',
        scripts: {
          test: 'echo "test placeholder"',
          typecheck: 'echo "typecheck placeholder"',
        },
      })),
    getQuestFiles: getQuestFiles ?? ((): string[] => []),
    executeCommand:
      executeCommand ??
      ((): { stdout: string; stderr: string; exitCode: number } => ({
        stdout: '',
        stderr: '',
        exitCode: 0,
      })),
    cleanup: cleanup ?? ((): void => undefined),
  };
};
