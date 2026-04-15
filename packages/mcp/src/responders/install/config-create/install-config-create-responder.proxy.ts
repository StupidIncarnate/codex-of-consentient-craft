/**
 * PURPOSE: Test proxy for InstallConfigCreateResponder, mocking adapters and brokers
 *
 * USAGE:
 * const proxy = InstallConfigCreateResponderProxy();
 * proxy.setupFileRead({ content: '{"mcpServers":{}}' });
 * const result = await proxy.callResponder({ context });
 */

import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { settingsPermissionsAddBrokerProxy } from '../../../brokers/settings/permissions-add/settings-permissions-add-broker.proxy';
import { FileContentsStub, PathSegmentStub as FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FileContents } from '@dungeonmaster/shared/contracts';
import { InstallConfigCreateResponder } from './install-config-create-responder';

export const InstallConfigCreateResponderProxy = (): {
  callResponder: typeof InstallConfigCreateResponder;
  setupFileRead: ({ content }: { content: FileContents }) => void;
  setupFileReadError: () => void;
  getWrittenConfig: () => unknown;
} => {
  pathJoinAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const settingsProxy = settingsPermissionsAddBrokerProxy();

  return {
    callResponder: InstallConfigCreateResponder,

    setupFileRead: ({ content }: { content: FileContents }): void => {
      readProxy.returns({
        filepath: FilePathStub(),
        contents: FileContentsStub({ value: content }),
      });
      writeProxy.succeeds({
        filepath: FilePathStub(),
        contents: FileContentsStub({ value: '' }),
      });
      settingsProxy.setupNoExistingSettings({ settingsPath: FilePathStub() });
    },

    setupFileReadError: (): void => {
      readProxy.throws({
        filepath: FilePathStub(),
        error: new Error('ENOENT'),
      });
      writeProxy.succeeds({
        filepath: FilePathStub(),
        contents: FileContentsStub({ value: '' }),
      });
      settingsProxy.setupNoExistingSettings({ settingsPath: FilePathStub() });
    },

    getWrittenConfig: (): unknown => writeProxy.getWrittenContent(),
  };
};
