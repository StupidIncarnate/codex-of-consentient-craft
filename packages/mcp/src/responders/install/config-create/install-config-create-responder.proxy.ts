/**
 * PURPOSE: Test proxy for InstallConfigCreateResponder, mocking adapters and brokers
 *
 * USAGE:
 * const proxy = InstallConfigCreateResponderProxy();
 * proxy.setupFileRead({ content: '{"mcpServers":{}}' });
 * const result = await proxy.callResponder({ context });
 */

import type { join } from 'path';
import { requireActual } from '@dungeonmaster/testing/register-mock';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { settingsPermissionsAddBrokerProxy } from '../../../brokers/settings/permissions-add/settings-permissions-add-broker.proxy';
import {
  FileContentsStub,
  PathSegmentStub,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';
import type { FileContents, FilePathStub } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { InstallConfigCreateResponder } from './install-config-create-responder';

type FilePath = ReturnType<typeof FilePathStub>;
type PathSegment = ReturnType<typeof PathSegmentStub>;

export const InstallConfigCreateResponderProxy = (): {
  callResponder: typeof InstallConfigCreateResponder;
  setupFileRead: ({
    targetProjectRoot,
    content,
  }: {
    targetProjectRoot: FilePath;
    content: FileContents;
  }) => void;
  setupFileReadError: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => void;
  getWrittenConfig: ({ targetProjectRoot }: { targetProjectRoot: FilePath }) => unknown;
} => {
  pathJoinAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const settingsProxy = settingsPermissionsAddBrokerProxy();

  // Mirrors the responder's own configPath/settingsPath computation — including its FilePath ->
  // PathSegment re-brand — so the read/write/settings addresses below match what the responder
  // really calls join with (join's real passthrough default is left in place — see
  // path-join-adapter.proxy.ts).
  const actualPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const configPathFor = ({ targetProjectRoot }: { targetProjectRoot: FilePath }): PathSegment =>
    PathSegmentStub({
      value: actualPath.join(targetProjectRoot, locationsStatics.repoRoot.mcpJson),
    });
  const claudeSettingsPathFor = ({
    targetProjectRoot,
  }: {
    targetProjectRoot: FilePath;
  }): PathSegment =>
    PathSegmentStub({
      value: actualPath.join(
        targetProjectRoot,
        locationsStatics.repoRoot.claude.dir,
        locationsStatics.repoRoot.claude.settings,
      ),
    });

  return {
    callResponder: InstallConfigCreateResponder,

    setupFileRead: ({
      targetProjectRoot,
      content,
    }: {
      targetProjectRoot: FilePath;
      content: FileContents;
    }): void => {
      readProxy.returnsFor({
        filepath: configPathFor({ targetProjectRoot }),
        contents: FileContentsStub({ value: content }),
      });
      writeProxy.succeeds({ filepath: configPathFor({ targetProjectRoot }) });
      settingsProxy.setupNoExistingSettings({
        targetProjectRoot: pathSegmentContract.parse(targetProjectRoot),
        settingsPath: claudeSettingsPathFor({ targetProjectRoot }),
      });
    },

    setupFileReadError: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): void => {
      readProxy.throwsFor({
        filepath: configPathFor({ targetProjectRoot }),
        error: new Error('ENOENT'),
      });
      writeProxy.succeeds({ filepath: configPathFor({ targetProjectRoot }) });
      settingsProxy.setupNoExistingSettings({
        targetProjectRoot: pathSegmentContract.parse(targetProjectRoot),
        settingsPath: claudeSettingsPathFor({ targetProjectRoot }),
      });
    },

    getWrittenConfig: ({ targetProjectRoot }: { targetProjectRoot: FilePath }): unknown =>
      writeProxy.getWrittenFor({ filepath: configPathFor({ targetProjectRoot }) }),
  };
};
