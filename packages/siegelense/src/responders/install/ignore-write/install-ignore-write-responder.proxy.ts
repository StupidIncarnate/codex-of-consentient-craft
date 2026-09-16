import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fsExistsSyncAdapterProxy, pathResolveAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { ArrayEntryAnchorInsertLayerResponderProxy } from './array-entry-anchor-insert-layer-responder.proxy';
import { InstallIgnoreWriteResponder } from './install-ignore-write-responder';

// Every caller in these tests exercises targetProjectRoot: '/project' (the real, unstaged
// pathResolve passthrough resolves it to these exact paths), so every test lands on these files.
// Two brands per path: `fsExistsSyncAdapterProxy` (shared) takes `FilePath`, while this package's
// own `fsReadFileAdapterProxy` / `fsWriteFileAdapterProxy` take `AbsoluteFilePath` — the same
// string, two brands, because the write adapter resolves `Promise<AdapterResult>`, not `void`,
// and neither brand is assignable to the other.
const GITIGNORE_PATH_STRING = '/project/.gitignore';
const GITIGNORE_PATH = FilePathStub({ value: GITIGNORE_PATH_STRING });
const GITIGNORE_ABSOLUTE_PATH = AbsoluteFilePathStub({ value: GITIGNORE_PATH_STRING });

const ESLINT_CONFIG_TS_PATH = FilePathStub({ value: '/project/eslint.config.ts' });
const ESLINT_CONFIG_JS_PATH_STRING = '/project/eslint.config.js';
const ESLINT_CONFIG_JS_PATH = FilePathStub({ value: ESLINT_CONFIG_JS_PATH_STRING });
const ESLINT_CONFIG_JS_ABSOLUTE_PATH = AbsoluteFilePathStub({
  value: ESLINT_CONFIG_JS_PATH_STRING,
});
const ESLINT_CONFIG_MJS_PATH = FilePathStub({ value: '/project/eslint.config.mjs' });
const ESLINT_CONFIG_CJS_PATH = FilePathStub({ value: '/project/eslint.config.cjs' });

const TSCONFIG_PATH_STRING = '/project/tsconfig.json';
const TSCONFIG_PATH = FilePathStub({ value: TSCONFIG_PATH_STRING });
const TSCONFIG_ABSOLUTE_PATH = AbsoluteFilePathStub({ value: TSCONFIG_PATH_STRING });

// "TestRunner", never the literal word this file's own proxy pattern rule bans in a helper name.
const TEST_RUNNER_CONFIG_JS_PATH_STRING = '/project/jest.config.js';
const TEST_RUNNER_CONFIG_JS_PATH = FilePathStub({ value: TEST_RUNNER_CONFIG_JS_PATH_STRING });
const TEST_RUNNER_CONFIG_JS_ABSOLUTE_PATH = AbsoluteFilePathStub({
  value: TEST_RUNNER_CONFIG_JS_PATH_STRING,
});
const TEST_RUNNER_CONFIG_CJS_PATH = FilePathStub({ value: '/project/jest.config.cjs' });

export const InstallIgnoreWriteResponderProxy = (): {
  callResponder: typeof InstallIgnoreWriteResponder;
  setupGitignore: (params: { present: boolean; content?: string }) => void;
  setupEslintConfig: (params: { content: string }) => void;
  setupTsconfig: (params: { content: string }) => void;
  setupTestRunnerConfig: (params: { content: string }) => void;
  getWrittenGitignore: () => unknown;
  getWrittenEslintConfig: () => unknown;
  getWrittenTsconfig: () => unknown;
  getWrittenTestRunnerConfig: () => unknown;
  wasGitignoreRead: () => boolean;
  wasTsconfigRead: () => boolean;
  wasTestRunnerConfigRead: () => boolean;
} => {
  pathResolveAdapterProxy();
  ArrayEntryAnchorInsertLayerResponderProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  // A second handle on the SAME underlying mock as fsReadFileAdapterProxy — registerMock shares
  // state per function, so this observes the exact same call history without the adapter proxy
  // itself needing to expose one. It is what proves a read really fired, distinct from a responder
  // that merely defaulted to an empty string and never called it at all.
  const readFileHandle = registerMock({ fn: readFile });

  // The responder always probes every candidate for each surface; default every candidate to
  // absent so a test that only cares about one surface need not stage all of them itself.
  existsProxy.returns({ filePath: ESLINT_CONFIG_TS_PATH, result: false });
  existsProxy.returns({ filePath: ESLINT_CONFIG_JS_PATH, result: false });
  existsProxy.returns({ filePath: ESLINT_CONFIG_MJS_PATH, result: false });
  existsProxy.returns({ filePath: ESLINT_CONFIG_CJS_PATH, result: false });
  existsProxy.returns({ filePath: TSCONFIG_PATH, result: false });
  existsProxy.returns({ filePath: TEST_RUNNER_CONFIG_JS_PATH, result: false });
  existsProxy.returns({ filePath: TEST_RUNNER_CONFIG_CJS_PATH, result: false });

  return {
    callResponder: InstallIgnoreWriteResponder,

    setupGitignore: ({ present, content }: { present: boolean; content?: string }): void => {
      existsProxy.returns({ filePath: GITIGNORE_PATH, result: present });
      if (present) {
        readProxy.resolves({ filePath: GITIGNORE_ABSOLUTE_PATH, content: content ?? '' });
      }
      writeProxy.succeeds({ filePath: GITIGNORE_ABSOLUTE_PATH });
    },

    setupEslintConfig: ({ content }: { content: string }): void => {
      existsProxy.returns({ filePath: ESLINT_CONFIG_JS_PATH, result: true });
      readProxy.resolves({ filePath: ESLINT_CONFIG_JS_ABSOLUTE_PATH, content });
      writeProxy.succeeds({ filePath: ESLINT_CONFIG_JS_ABSOLUTE_PATH });
    },

    setupTsconfig: ({ content }: { content: string }): void => {
      existsProxy.returns({ filePath: TSCONFIG_PATH, result: true });
      readProxy.resolves({ filePath: TSCONFIG_ABSOLUTE_PATH, content });
      writeProxy.succeeds({ filePath: TSCONFIG_ABSOLUTE_PATH });
    },

    setupTestRunnerConfig: ({ content }: { content: string }): void => {
      existsProxy.returns({ filePath: TEST_RUNNER_CONFIG_JS_PATH, result: true });
      readProxy.resolves({ filePath: TEST_RUNNER_CONFIG_JS_ABSOLUTE_PATH, content });
      writeProxy.succeeds({ filePath: TEST_RUNNER_CONFIG_JS_ABSOLUTE_PATH });
    },

    getWrittenGitignore: (): unknown =>
      writeProxy.getWrittenFor({ filePath: GITIGNORE_ABSOLUTE_PATH }),
    getWrittenEslintConfig: (): unknown =>
      writeProxy.getWrittenFor({ filePath: ESLINT_CONFIG_JS_ABSOLUTE_PATH }),
    getWrittenTsconfig: (): unknown =>
      writeProxy.getWrittenFor({ filePath: TSCONFIG_ABSOLUTE_PATH }),
    getWrittenTestRunnerConfig: (): unknown =>
      writeProxy.getWrittenFor({ filePath: TEST_RUNNER_CONFIG_JS_ABSOLUTE_PATH }),

    wasGitignoreRead: (): boolean =>
      readFileHandle.callsMatching([GITIGNORE_ABSOLUTE_PATH]).length > 0,
    wasTsconfigRead: (): boolean =>
      readFileHandle.callsMatching([TSCONFIG_ABSOLUTE_PATH]).length > 0,
    wasTestRunnerConfigRead: (): boolean =>
      readFileHandle.callsMatching([TEST_RUNNER_CONFIG_JS_ABSOLUTE_PATH]).length > 0,
  };
};
