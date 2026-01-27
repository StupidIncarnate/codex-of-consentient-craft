import type { FilePath } from '@dungeonmaster/shared/contracts';
import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import { findParentConfigsLayerBrokerProxy } from './find-parent-configs-layer-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const configResolveBrokerProxy = (): {
  setupConfigFound: (params: { startPath: string; configPath: string }) => void;
  setupConfigNotFound: (params: { startPath: string }) => void;
  setupValidConfig: (params: { config: Record<string, unknown> }) => void;
  setupFileNotFound: () => void;
  setupDirname: (params: { result: FilePath }) => void;
} => {
  const findProxy = configFileFindBrokerProxy();
  const loadProxy = configFileLoadBrokerProxy();
  findParentConfigsLayerBrokerProxy();
  const dirnameProxy = pathDirnameAdapterProxy();

  return {
    setupConfigFound: (params: { startPath: string; configPath: string }): void => {
      findProxy.setupConfigFound(params);
    },
    setupConfigNotFound: (params: { startPath: string }): void => {
      findProxy.setupConfigNotFound(params);
    },
    setupValidConfig: (params: { config: Record<string, unknown> }): void => {
      loadProxy.setupValidConfig(params);
    },
    setupFileNotFound: (): void => {
      loadProxy.setupFileNotFound();
    },
    setupDirname: (params: { result: FilePath }): void => {
      dirnameProxy.returns(params);
    },
  };
};
