import { readFile } from 'fs/promises';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { resolve } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { ArrayEntryAnchorInsertLayerResponderProxy } from './array-entry-anchor-insert-layer-responder.proxy';
import { InstallIgnoreWriteResponder } from './install-ignore-write-responder';

// Every caller in these tests exercises targetProjectRoot: '/project' (the real, unstaged
// resolve passthrough resolves it to these exact paths), so every test lands on these files.
// Two brands per path: `existsSyncProxy` (gateway) takes a raw path, while this package's own
// `fsReadFileAdapterProxy` / `fsWriteFileAdapterProxy` take `AbsoluteFilePath` — the same string,
// because the write adapter resolves `Promise<AdapterResult>`, not `void`.
const GITIGNORE_PATH_STRING = '/project/.gitignore';
const GITIGNORE_ABSOLUTE_PATH = AbsoluteFilePathStub({ value: GITIGNORE_PATH_STRING });

const ESLINT_CONFIG_TS_PATH_STRING = '/project/eslint.config.ts';
const ESLINT_CONFIG_JS_PATH_STRING = '/project/eslint.config.js';
const ESLINT_CONFIG_JS_ABSOLUTE_PATH = AbsoluteFilePathStub({
  value: ESLINT_CONFIG_JS_PATH_STRING,
});
const ESLINT_CONFIG_MJS_PATH_STRING = '/project/eslint.config.mjs';
const ESLINT_CONFIG_CJS_PATH_STRING = '/project/eslint.config.cjs';

const TSCONFIG_PATH_STRING = '/project/tsconfig.json';
const TSCONFIG_ABSOLUTE_PATH = AbsoluteFilePathStub({ value: TSCONFIG_PATH_STRING });

// "TestRunner", never the literal word this file's own proxy pattern rule bans in a helper name.
const TEST_RUNNER_CONFIG_JS_PATH_STRING = '/project/jest.config.js';
const TEST_RUNNER_CONFIG_JS_ABSOLUTE_PATH = AbsoluteFilePathStub({
  value: TEST_RUNNER_CONFIG_JS_PATH_STRING,
});
const TEST_RUNNER_CONFIG_CJS_PATH_STRING = '/project/jest.config.cjs';

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
  // #gateway/node/path re-exports `resolve` bare (no per-function proxy of its own, unlike
  // fs/fs__promises/child_process) — mocked directly here, with the same sticky real-passthrough
  // default instance-start-broker.proxy.ts's own `join` staging uses (A12 SL7), so
  // resolve('/project', '.gitignore') keeps computing a genuine path.
  const realPath = requireActual<{ resolve: typeof resolve }>({ module: 'path' });
  registerMock({ fn: resolve })
    .calledWith([])
    .implement((...segments: never[]) => realPath.resolve(...segments));
  ArrayEntryAnchorInsertLayerResponderProxy();
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  // A second handle on the SAME underlying mock as fsReadFileAdapterProxy — registerMock shares
  // state per function, so this observes the exact same call history without the adapter proxy
  // itself needing to expose one. It is what proves a read really fired, distinct from a responder
  // that merely defaulted to an empty string and never called it at all.
  const readFileHandle = registerMock({ fn: readFile });

  // The responder always probes every candidate for each surface; default every candidate to
  // absent so a test that only cares about one surface need not stage all of them itself.
  existsProxy.returns({ path: ESLINT_CONFIG_TS_PATH_STRING, exists: false });
  existsProxy.returns({ path: ESLINT_CONFIG_JS_PATH_STRING, exists: false });
  existsProxy.returns({ path: ESLINT_CONFIG_MJS_PATH_STRING, exists: false });
  existsProxy.returns({ path: ESLINT_CONFIG_CJS_PATH_STRING, exists: false });
  existsProxy.returns({ path: TSCONFIG_PATH_STRING, exists: false });
  existsProxy.returns({ path: TEST_RUNNER_CONFIG_JS_PATH_STRING, exists: false });
  existsProxy.returns({ path: TEST_RUNNER_CONFIG_CJS_PATH_STRING, exists: false });

  return {
    callResponder: InstallIgnoreWriteResponder,

    setupGitignore: ({ present, content }: { present: boolean; content?: string }): void => {
      existsProxy.returns({ path: GITIGNORE_PATH_STRING, exists: present });
      if (present) {
        readProxy.resolves({ filePath: GITIGNORE_ABSOLUTE_PATH, content: content ?? '' });
      }
      writeProxy.succeeds({ filePath: GITIGNORE_ABSOLUTE_PATH });
    },

    setupEslintConfig: ({ content }: { content: string }): void => {
      existsProxy.returns({ path: ESLINT_CONFIG_JS_PATH_STRING, exists: true });
      readProxy.resolves({ filePath: ESLINT_CONFIG_JS_ABSOLUTE_PATH, content });
      writeProxy.succeeds({ filePath: ESLINT_CONFIG_JS_ABSOLUTE_PATH });
    },

    setupTsconfig: ({ content }: { content: string }): void => {
      existsProxy.returns({ path: TSCONFIG_PATH_STRING, exists: true });
      readProxy.resolves({ filePath: TSCONFIG_ABSOLUTE_PATH, content });
      writeProxy.succeeds({ filePath: TSCONFIG_ABSOLUTE_PATH });
    },

    setupTestRunnerConfig: ({ content }: { content: string }): void => {
      existsProxy.returns({ path: TEST_RUNNER_CONFIG_JS_PATH_STRING, exists: true });
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
