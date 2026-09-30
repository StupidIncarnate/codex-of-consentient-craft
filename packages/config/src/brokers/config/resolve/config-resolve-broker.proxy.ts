import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { dirname } from '#gateway/node/path';
import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import { findParentConfigsLayerBrokerProxy } from './find-parent-configs-layer-broker.proxy';

export const configResolveBrokerProxy = (): {
  setupConfigFound: (params: { startPath: string; configPath: string }) => void;
  setupConfigNotFound: (params: { startPath: string }) => void;
  setupValidConfig: (params: { configPath: string; config: Record<string, unknown> }) => void;
  setupFileNotFound: (params: { configPath: string }) => void;
} => {
  const findProxy = configFileFindBrokerProxy();
  const loadProxy = configFileLoadBrokerProxy();
  findParentConfigsLayerBrokerProxy();
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  const dirnameHandle = registerMock({ fn: dirname });

  // configResolveBroker takes dirname(configPath) to start the parent walk, and the walk's
  // config-file find takes dirname of that directory; both are real passthroughs on those exact
  // arguments.
  const stageParentWalkDirnames = ({ configPath }: { configPath: string }): void => {
    const configDir = realPath.dirname(configPath);
    dirnameHandle.calledWith([configPath]).implement(realPath.dirname);
    dirnameHandle.calledWith([configDir]).implement(realPath.dirname);
  };

  return {
    setupConfigFound: (params: { startPath: string; configPath: string }): void => {
      findProxy.setupConfigFound(params);
      stageParentWalkDirnames({ configPath: params.configPath });
    },
    setupConfigNotFound: (params: { startPath: string }): void => {
      findProxy.setupConfigNotFound(params);
    },
    // configResolveBroker calls configFileLoadBroker with the configPath the preceding
    // setupConfigFound call just described - callers pass that same value here.
    setupValidConfig: (params: { configPath: string; config: Record<string, unknown> }): void => {
      loadProxy.setupValidConfig({
        configPath: params.configPath,
        config: params.config,
      });
    },
    setupFileNotFound: (params: { configPath: string }): void => {
      loadProxy.setupFileNotFound({ configPath: params.configPath });
    },
  };
};
