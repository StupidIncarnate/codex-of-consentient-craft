import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { InstallCreateSettingsResponder } from './install-create-settings-responder';

// Every current test supplies this exact targetProjectRoot; the settings path below is derived
// from it so the fs read/write staging matches what the responder actually joins together.
const TARGET_PROJECT_ROOT = '/project';

export const InstallCreateSettingsResponderProxy = (): {
  callResponder: typeof InstallCreateSettingsResponder;
  setupNoExistingSettings: () => void;
  setupExistingSettings: (params: { content: ReturnType<typeof FileContentsStub> }) => void;
  getWrittenContent: () => unknown;
} => {
  const joinProxy = pathJoinAdapterProxy();

  // The responder joins targetProjectRoot/.claude/settings.json before any read or write; give
  // it the real path.join instead of staging the combination, so the fs proxies below can be
  // addressed by the one settingsPath every test in this file agrees on.
  const { join: realJoin } = requireActual<{ join: typeof join }>({ module: 'path' });
  joinProxy
    .getHandle()
    .calledWith([])
    .implement((...segments) => realJoin(...segments));

  const settingsPath = FilePathStub({
    value: realJoin(
      TARGET_PROJECT_ROOT,
      locationsStatics.repoRoot.claude.dir,
      locationsStatics.repoRoot.claude.settings,
    ),
  });

  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  // succeeds() only addresses by filepath (contents is discarded there too) — this proxy's own
  // callers assert on the ACTUAL written content via getWrittenContent(), not on this dummy value.
  writeProxy.succeeds({ filepath: settingsPath, contents: FileContentsStub() });

  return {
    callResponder: InstallCreateSettingsResponder,

    setupNoExistingSettings: (): void => {
      readProxy.throws({
        filePath: settingsPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },

    setupExistingSettings: ({
      content,
    }: {
      content: ReturnType<typeof FileContentsStub>;
    }): void => {
      readProxy.returns({ filePath: settingsPath, contents: content });
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenFor({ filepath: settingsPath }),
  };
};
