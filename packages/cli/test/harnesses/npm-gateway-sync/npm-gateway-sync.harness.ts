/**
 * PURPOSE: What the npm-gateway sync's integration tests need beyond a testbed — staging the
 * `npm_command=ci` environment npm sets under `npm ci` or the `npm_lifecycle_event` it sets
 * while running a lifecycle script such as the root `postinstall`, and reading a file of dungeonmaster's own
 * installed npm gateway, the source a copied folder must match byte for byte, and compiling what the
 * sync wrote under the CommonJS gateway's own options, the check a text comparison cannot make. The environment is
 * restored after every test, so a staged variable never leaks into the next one.
 *
 * USAGE:
 * const sync = npmGatewaySyncHarness();
 * // inside an it(): sync.stageNpmCi(); sync.stageLifecycleEvent({ value: 'postinstall' }); sync.readOwnGatewayFile({ relativePath: 'elkjs/elkjs.ts' });
 */

import * as ts from '#gateway/npm/typescript';
import { run } from '#gateway/node/child_process';
import { readFileSync } from '#gateway/node/fs';
import { resolvePackageRoot } from '#gateway/node/module';
import { dirname, join } from '#gateway/node/path';
import { deleteEnv, execPath, getEnv, setEnv } from '#gateway/node/process';

const NPM_COMMAND_ENV = 'npm_command';
const NPM_LIFECYCLE_EVENT_ENV = 'npm_lifecycle_event';
const OWN_GATEWAY_SPECIFIER = '@dungeonmaster/npm/package.json';
const JEST_TYPES_SPECIFIER = '@types/jest/package.json';
const JEST_SPECIFIER = 'jest/package.json';
const TS_JEST_SPECIFIER = 'ts-jest/package.json';
const JEST_NODE_ENVIRONMENT_SPECIFIER = 'jest-environment-node/package.json';
const TESTS_SUMMARY_PATTERN = /^Tests:.*$/mu;
const WHITESPACE_RUN = /\s+/gu;

export const npmGatewaySyncHarness = (): {
  stageNpmCi: () => void;
  stageLifecycleEvent: (params: { value: string | undefined }) => void;
  readOwnGatewayFile: (params: { relativePath: string }) => string;
  compileDiagnostics: (params: { repoRoot: string; relativePaths: readonly string[] }) => string[];
  runWrittenTests: (params: { repoRoot: string; relativeDir: string }) => Promise<string>;
  afterEach: () => void;
} => {
  // The value each variable held before a stage method changed it, captured at stage time; empty when
  // nothing was staged this test, so afterEach leaves the environment alone.
  const staged = new Map<string, string | undefined>();

  return {
    stageNpmCi: (): void => {
      staged.set(NPM_COMMAND_ENV, getEnv(NPM_COMMAND_ENV));
      setEnv(NPM_COMMAND_ENV, 'ci');
    },

    stageLifecycleEvent: ({ value }): void => {
      staged.set(NPM_LIFECYCLE_EVENT_ENV, getEnv(NPM_LIFECYCLE_EVENT_ENV));
      if (value === undefined) {
        deleteEnv(NPM_LIFECYCLE_EVENT_ENV);
      } else {
        setEnv(NPM_LIFECYCLE_EVENT_ENV, value);
      }
    },

    readOwnGatewayFile: ({ relativePath }): string =>
      readFileSync(
        join(String(resolvePackageRoot({ specifier: OWN_GATEWAY_SPECIFIER })), 'src', relativePath),
      ),

    // Compiles written files the way the consumer's CommonJS npm gateway package does — node16
    // module and resolution — with this repo's own @types/jest for a test file's globals, and
    // hands back every diagnostic as `<file>(<line>): TS<code>: <message>`.
    compileDiagnostics: ({ repoRoot, relativePaths }): string[] => {
      const jestTypesRoot = dirname(
        String(resolvePackageRoot({ specifier: JEST_TYPES_SPECIFIER })),
      );
      const options: ts.CompilerOptions = {
        module: ts.ModuleKind.Node16,
        moduleResolution: ts.ModuleResolutionKind.Node16,
        target: ts.ScriptTarget.ES2022,
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        noEmit: true,
        typeRoots: [jestTypesRoot],
        types: ['jest'],
      };
      const program = ts.createProgram(
        relativePaths.map((relativePath) => join(repoRoot, relativePath)),
        options,
      );
      return [
        ...program.getOptionsDiagnostics(),
        ...program.getGlobalDiagnostics(),
        ...program.getSyntacticDiagnostics(),
        ...program.getSemanticDiagnostics(),
      ].map((diagnostic) => {
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ');
        const file = diagnostic.file?.fileName.slice(repoRoot.length + 1) ?? '<global>';
        const line =
          diagnostic.file === undefined || diagnostic.start === undefined
            ? 0
            : diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1;
        return `${file}(${String(line)}): TS${String(diagnostic.code)}: ${message}`;
      });
    },

    // Runs every `*.test.ts` under one testbed directory with this repo's own jest and ts-jest —
    // type errors are compileDiagnostics' job, so ts-jest only transpiles here. Hands back the
    // exit code and jest's `Tests:` summary line, or the whole output when there is no summary.
    runWrittenTests: async ({ repoRoot, relativeDir }): Promise<string> => {
      const packageRootOf = (specifier: string): string =>
        String(resolvePackageRoot({ specifier }));
      const config = {
        rootDir: repoRoot,
        roots: [join(repoRoot, relativeDir)],
        testMatch: ['**/*.test.ts'],
        testEnvironment: packageRootOf(JEST_NODE_ENVIRONMENT_SPECIFIER),
        cacheDirectory: join(repoRoot, '.jest-cache'),
        transform: {
          '^.+\\.ts$': [
            packageRootOf(TS_JEST_SPECIFIER),
            {
              diagnostics: false,
              tsconfig: { module: 'commonjs', target: 'ES2022', esModuleInterop: true },
            },
          ],
        },
      };
      const result = await run({
        command: execPath,
        args: [
          join(packageRootOf(JEST_SPECIFIER), 'bin', 'jest.js'),
          '--ci',
          '--runInBand',
          '--watchman=false',
          '--config',
          JSON.stringify(config),
        ],
        cwd: repoRoot,
      });
      const summary = TESTS_SUMMARY_PATTERN.exec(result.output)?.[0];
      return summary === undefined
        ? `exit ${String(result.exitCode)}\n${result.output}`
        : `exit ${String(result.exitCode)}; ${summary.replace(WHITESPACE_RUN, ' ')}`;
    },

    afterEach: (): void => {
      for (const [name, original] of staged) {
        if (original === undefined) {
          deleteEnv(name);
        } else {
          setEnv(name, original);
        }
      }
      staged.clear();
    },
  };
};
