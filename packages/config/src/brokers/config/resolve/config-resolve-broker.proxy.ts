import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import { findParentConfigsLayerBrokerProxy } from './find-parent-configs-layer-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const configResolveBrokerProxy = (): {
  findProxy: ReturnType<typeof configFileFindBrokerProxy>;
  loadProxy: ReturnType<typeof configFileLoadBrokerProxy>;
  dirnameProxy: ReturnType<typeof pathDirnameAdapterProxy>;
} => {
  const findProxy = configFileFindBrokerProxy();
  const loadProxy = configFileLoadBrokerProxy();
  findParentConfigsLayerBrokerProxy();
  const dirnameProxy = pathDirnameAdapterProxy();

  return {
    findProxy,
    loadProxy,
    dirnameProxy,
  };
};
