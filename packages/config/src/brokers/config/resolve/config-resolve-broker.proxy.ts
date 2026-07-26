import type { FilePath } from '@dungeonmaster/shared/contracts';
import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import { findParentConfigsLayerBrokerProxy } from './find-parent-configs-layer-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const configResolveBrokerProxy = (): {
  setupConfigFound: (params: { startPath: string; configPath: string }) => void;
  setupConfigNotFound: (params: { startPath: string }) => void;
  setupValidConfig: (params: { configPath: string; config: Record<string, unknown> }) => void;
  setupFileNotFound: (params: { configPath: string }) => void;
  setupDirname: (params: { configPath: string; result: FilePath }) => void;
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
    // configResolveBroker calls configFileLoadBroker with the configPath the preceding
    // setupConfigFound call just described - callers pass that same value here.
    setupValidConfig: (params: { configPath: string; config: Record<string, unknown> }): void => {
      loadProxy.setupValidConfig({
        configPath: params.configPath as FilePath,
        config: params.config,
      });
    },
    setupFileNotFound: (params: { configPath: string }): void => {
      loadProxy.setupFileNotFound({ configPath: params.configPath as FilePath });
    },
    // configResolveBroker calls dirname on that same configPath (when framework !== 'monorepo')
    // to compute where to start the parent-config search. dirname is call-order-scoped (see
    // THE JOIN/DIRNAME/BASENAME TRAP in path-dirname-adapter.proxy.ts), so configPath is kept
    // as a parameter purely so call sites read as "dirname of this path", not because it's
    // used to key the mock.
    setupDirname: (params: { configPath: string; result: FilePath }): void => {
      dirnameProxy.returns({ result: params.result });
    },
  };
};
