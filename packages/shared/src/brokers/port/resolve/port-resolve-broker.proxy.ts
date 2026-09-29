import { deleteEnv, setEnv } from '#gateway/node/process';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { portConfigWalkBrokerProxy } from '../config-walk/port-config-walk-broker.proxy';

export const portResolveBrokerProxy = (): {
  setEnvPort: (params: { value: string }) => void;
  clearEnvPort: () => void;
  setupConfigPort: (params: { startDir: string; port: number }) => void;
  setupNoConfig: (params: { startDir: string }) => void;
} => {
  getEnvProxy();
  const walkProxy = portConfigWalkBrokerProxy();
  // cwd() is a real read with nothing to fake (#gateway/node/process's own cwdProxy is empty) —
  // composed only to satisfy enforce-proxy-child-creation for the `cwd` import above. Every test
  // here supplies `startDir` explicitly, so the broker never actually calls cwd().
  cwdProxy();

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
