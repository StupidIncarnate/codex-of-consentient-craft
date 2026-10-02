import { deleteEnv, setEnv } from '#gateway/node/process';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { portConfigWalkBrokerProxy } from '../config-walk/port-config-walk-broker.proxy';

export const portResolveBrokerProxy = (): {
  setEnvPort: (params: { value: string }) => void;
  clearEnvPort: () => void;
  setupConfigPort: (params: { startDir: string; port: number }) => void;
  setupNoConfig: (params: { startDir: string }) => void;
} => {
  getEnvProxy();
  const walkProxy = portConfigWalkBrokerProxy();

  return {
    setEnvPort: ({ value }: { value: string }): void => {
      setEnv('DUNGEONMASTER_PORT', value);
    },

    clearEnvPort: (): void => {
      deleteEnv('DUNGEONMASTER_PORT');
    },

    setupConfigPort: ({ startDir, port }: { startDir: string; port: number }): void => {
      walkProxy.setupPortFound({ dir: startDir, port });
    },

    setupNoConfig: ({ startDir }: { startDir: string }): void => {
      walkProxy.setupWalkToRoot({ startDir });
    },
  };
};
