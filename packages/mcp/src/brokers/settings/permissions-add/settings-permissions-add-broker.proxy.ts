import { join } from '#gateway/node/path';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import type { FileContentsStub } from '@dungeonmaster/shared/contracts';
import { PathSegmentStub as FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

type FilePath = ReturnType<typeof FilePathStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const settingsPermissionsAddBrokerProxy = (): {
  setupExistingSettings: ({
    targetProjectRoot,
    settingsPath,
    contents,
  }: {
    targetProjectRoot: FilePath;
    settingsPath: FilePath;
    contents: FileContents;
  }) => void;
  setupNoExistingSettings: ({
    targetProjectRoot,
    settingsPath,
  }: {
    targetProjectRoot: FilePath;
    settingsPath: FilePath;
  }) => void;
  setupInvalidJsonSettings: ({
    targetProjectRoot,
    settingsPath,
  }: {
    targetProjectRoot: FilePath;
    settingsPath: FilePath;
  }) => void;
  setupUnreadableSettings: ({
    targetProjectRoot,
    settingsPath,
  }: {
    targetProjectRoot: FilePath;
    settingsPath: FilePath;
  }) => void;
  wasWriteCalled: ({ settingsPath }: { settingsPath: FilePath }) => boolean;
} => {
  const readProxy = readJsonFileIfExistsProxy();
  const writeProxy = writeFileProxy();
  const ensureDirProxyHandle = ensureDirProxy();

  // Mirrors the broker's own settingsDir computation so the ensureDir address matches what the
  // broker really calls join with, instead of an arbitrary stub.
  const settingsDirFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): FilePath =>
    FilePathStub({ value: join(targetProjectRoot, locationsStatics.repoRoot.claude.dir) });

  return {
    setupExistingSettings: ({
      targetProjectRoot,
      settingsPath,
      contents,
    }: {
      targetProjectRoot: FilePath;
      settingsPath: FilePath;
      contents: FileContents;
    }): void => {
      ensureDirProxyHandle.succeeds({ path: settingsDirFor({ targetProjectRoot }) });
      readProxy.returnsRaw({ path: settingsPath, rawContents: contents });
      writeProxy.succeeds({ path: settingsPath });
    },
    setupNoExistingSettings: ({
      targetProjectRoot,
      settingsPath,
    }: {
      targetProjectRoot: FilePath;
      settingsPath: FilePath;
    }): void => {
      ensureDirProxyHandle.succeeds({ path: settingsDirFor({ targetProjectRoot }) });
      readProxy.missing({ path: settingsPath });
      writeProxy.succeeds({ path: settingsPath });
    },
    setupInvalidJsonSettings: ({
      targetProjectRoot,
      settingsPath,
    }: {
      targetProjectRoot: FilePath;
      settingsPath: FilePath;
    }): void => {
      ensureDirProxyHandle.succeeds({ path: settingsDirFor({ targetProjectRoot }) });
      // Real invalid JSON text, so the real `readJsonFile` produces the SyntaxError itself —
      // this proves the broker's own parse path rejects, not a stubbed rejection standing in for it.
      readProxy.returnsRaw({ path: settingsPath, rawContents: '{ not valid json' });
    },
    setupUnreadableSettings: ({
      targetProjectRoot,
      settingsPath,
    }: {
      targetProjectRoot: FilePath;
      settingsPath: FilePath;
    }): void => {
      ensureDirProxyHandle.succeeds({ path: settingsDirFor({ targetProjectRoot }) });
      readProxy.denied({ path: settingsPath });
    },
    wasWriteCalled: ({ settingsPath }: { settingsPath: FilePath }): boolean =>
      writeProxy.writtenContentsFor({ path: settingsPath }) !== undefined,
  };
};
