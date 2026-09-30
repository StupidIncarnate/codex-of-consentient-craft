import { installTestbedCreateBroker, FileContentStub } from '@dungeonmaster/testing';

import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import { ProjectResultStub } from '../../../contracts/project-result/project-result.stub';
import { ErrorEntryStub } from '../../../contracts/error-entry/error-entry.stub';
import { RawOutputStub } from '../../../contracts/raw-output/raw-output.stub';

import { checkRunTypecheckBroker } from './check-run-typecheck-broker';

// The unit suite mocks `spawn` addressed only by the resolved `tsc` command, identical for the
// checking and the build pass, so it cannot prove the two configs REALLY disagree — proving that
// needs a real `tsc` against a real fixture. `outside.ts` sits at the package root, imported from
// `src/a.ts`: `tsconfig.json` has no `rootDir`, so it passes; `tsconfig.build.json` sets
// `rootDir: "./src"`, so real `tsc` reports TS6059 on the import — this is the gap F3 closes.
describe('checkRunTypecheckBroker (integration) — real tsc, tsconfig.json vs tsconfig.build.json', () => {
  it('VALID: {tsconfig.build.json sets rootDir, outside.ts sits outside it} => tsconfig.json passes but the build config fails, and the run reports it', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: 'ward-typecheck-build-config-fail',
    });

    testbed.writeFile({
      relativePath: 'tsconfig.json',
      content: FileContentStub({
        value: JSON.stringify({
          compilerOptions: {
            noEmit: true,
            strict: false,
            module: 'commonjs',
            target: 'es2020',
          },
          include: ['src/**/*.ts', 'outside.ts'],
        }),
      }),
    });
    testbed.writeFile({
      relativePath: 'tsconfig.build.json',
      content: FileContentStub({
        value: JSON.stringify({
          compilerOptions: {
            noEmit: true,
            strict: false,
            module: 'commonjs',
            target: 'es2020',
            rootDir: './src',
          },
          include: ['src/**/*.ts', 'outside.ts'],
        }),
      }),
    });
    testbed.writeFile({
      relativePath: 'outside.ts',
      content: FileContentStub({ value: 'export const outsideValue = 1;\n' }),
    });
    testbed.writeFile({
      relativePath: 'src/a.ts',
      content: FileContentStub({
        value:
          "import { outsideValue } from '../outside';\n\nexport const usesOutside = outsideValue;\n",
      }),
    });

    const projectFolder = ProjectFolderStub({
      name: 'ward-typecheck-build-config-fail',
      path: testbed.guildPath,
    });

    const result = await checkRunTypecheckBroker({ projectFolder, fileList: [] });

    testbed.cleanup();

    const expectedMessage = [
      `TS6059: File '${testbed.guildPath}/outside.ts' is not under 'rootDir' '${testbed.guildPath}/src'. 'rootDir' is expected to contain all source files.`,
      'The file is in the program because:',
      `Imported via '../outside' from file '${testbed.guildPath}/src/a.ts'`,
      `Matched by include pattern 'outside.ts' in '${testbed.guildPath}/tsconfig.build.json'`,
    ].join('\n');
    const buildDiagnosticBlock = [
      `src/a.ts(1,30): error TS6059: File '${testbed.guildPath}/outside.ts' is not under 'rootDir' '${testbed.guildPath}/src'. 'rootDir' is expected to contain all source files.`,
      '  The file is in the program because:',
      `    Imported via '../outside' from file '${testbed.guildPath}/src/a.ts'`,
      `    Matched by include pattern 'outside.ts' in '${testbed.guildPath}/tsconfig.build.json'`,
    ].join('\n');

    expect(result).toStrictEqual(
      ProjectResultStub({
        projectFolder,
        discoveredCount: 2,
        status: 'fail',
        errors: [
          ErrorEntryStub({
            filePath: 'src/a.ts',
            line: 1,
            column: 30,
            message: expectedMessage,
            severity: 'error',
          }),
        ],
        testFailures: [],
        filesCount: 2,
        rawOutput: RawOutputStub({
          stdout: `--- tsconfig.build.json ---\n${buildDiagnosticBlock}\n`,
          stderr: '',
          exitCode: 2,
        }),
      }),
    );
  }, 30_000);

  it('VALID: {tsconfig.build.json exists and is also clean} => status stays pass, both configs run', async () => {
    const testbed = installTestbedCreateBroker({
      baseName: 'ward-typecheck-build-config-pass',
    });

    const cleanTsconfig = JSON.stringify({
      compilerOptions: {
        noEmit: true,
        strict: false,
        module: 'commonjs',
        target: 'es2020',
      },
      include: ['src/**/*.ts', 'outside.ts'],
    });
    testbed.writeFile({
      relativePath: 'tsconfig.json',
      content: FileContentStub({ value: cleanTsconfig }),
    });
    testbed.writeFile({
      relativePath: 'tsconfig.build.json',
      content: FileContentStub({ value: cleanTsconfig }),
    });
    testbed.writeFile({
      relativePath: 'outside.ts',
      content: FileContentStub({ value: 'export const outsideValue = 1;\n' }),
    });
    testbed.writeFile({
      relativePath: 'src/a.ts',
      content: FileContentStub({
        value:
          "import { outsideValue } from '../outside';\n\nexport const usesOutside = outsideValue;\n",
      }),
    });

    const projectFolder = ProjectFolderStub({
      name: 'ward-typecheck-build-config-pass',
      path: testbed.guildPath,
    });

    const result = await checkRunTypecheckBroker({ projectFolder, fileList: [] });

    testbed.cleanup();

    expect(result).toStrictEqual(
      ProjectResultStub({
        projectFolder,
        discoveredCount: 2,
        status: 'pass',
        errors: [],
        testFailures: [],
        filesCount: 2,
        rawOutput: RawOutputStub({ stdout: '', stderr: '', exitCode: 0 }),
      }),
    );
  }, 30_000);
});
