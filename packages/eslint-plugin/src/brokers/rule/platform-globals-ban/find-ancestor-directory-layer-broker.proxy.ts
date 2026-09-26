import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const findAncestorDirectoryLayerBrokerProxy = (): {
  setupMarkerAt: ({ dirPath, markerFileName }: { dirPath: string; markerFileName: string }) => void;
} => {
  // Constructed for their own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — findAncestorDirectoryLayerBroker mocks the raw fs.existsSync
  // directly below, since the walk probes many candidate paths no single adapter proxy addresses.
  fsExistsSyncAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  const handle = registerMock({ fn: existsSync });
  // No single path to key on: the walk probes many candidate directories, so the honest
  // catch-all is "nothing exists" and each test stages the one directory that does.
  handle.calledWith([]).implement(() => false);

  return {
    setupMarkerAt: ({
      dirPath,
      markerFileName,
    }: {
      dirPath: string;
      markerFileName: string;
    }): void => {
      handle.calledWith([`${dirPath}/${markerFileName}`]).returns(true);
    },
  };
};
