import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { portConfigWalkBrokerProxy } from '../config-walk/port-config-walk-broker.proxy';

export const portResolveBrokerProxy = (): {
  setEnvPort: (params: { value: string }) => void;
  clearEnvPort: () => void;
  setupConfigPort: (params: { startDir: string; port: number }) => void;
  setupNoConfig: (params: { startDir: string }) => void;
} => {
  const walkProxy = portConfigWalkBrokerProxy();
  // cwd() is a real read with nothing to fake (#gateway/node/process's own cwdProxy is empty) —
  // composed only to satisfy enforce-proxy-child-creation for the `cwd` import above. Every test
  // here supplies `startDir` explicitly, so the broker never actually calls cwd().
  cwdProxy();

  return {
    setEnvPort: ({ value }: { value: string }): void => {
      process.env.DUNGEONMASTER_PORT = value;
    },

    clearEnvPort: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_PORT');
    },

    setupConfigPort: ({ startDir, port }: { startDir: string; port: number }): void => {
      walkProxy.setupPortFound({ dir: startDir, port });
    },

    setupNoConfig: ({ startDir }: { startDir: string }): void => {
      walkProxy.setupWalkToRoot({ startDir });
    },
  };
};
