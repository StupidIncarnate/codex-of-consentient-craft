import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { configRootFindBrokerProxy } from '../../config-root/find/config-root-find-broker.proxy';

export const locationsClaudeSettingsPathFindBrokerProxy = (): {
  setupSettingsPath: (params: { startPath: string; configRootPath: string }) => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();

  // `join` is a real pass-through with no gateway proxy of its own, so nothing normally mocks
  // it here. But a cross-package composer importing THIS proxy through
  // `@dungeonmaster/shared/testing` pulls in every OTHER proxy that barrel still re-exports —
  // including the not-yet-deleted `path-join-adapter.proxy.ts`, whose own `registerMock({fn:
  // join})` gets statically collected and hoisted for that consumer's test file even though
  // nothing there ever calls it. That leaves `join` a bare, unconfigured jest.fn() returning
  // `undefined` unless THIS proxy also gives it a real, working default — a real passthrough via
  // requireActual, same mechanism the adapter proxy used, bypassing whichever mock (if any) is
  // covering it.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupSettingsPath: ({
      startPath,
      configRootPath,
    }: {
      startPath: string;
      configRootPath: string;
    }): void => {
      configRootProxy.setupConfigRootFoundInParent({ startPath, configRootPath });
    },
  };
};
