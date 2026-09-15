import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { packageRootFindLayerAdapterProxy } from './package-root-find-layer-adapter.proxy';

export const cliPackageBinResolveAdapterProxy = (): {
  manifestDeclaresBin: (params: { binRelative: string }) => void;
  manifestHasNoBinField: () => void;
  packageRootDoesNotExist: () => void;
} => {
  const layerProxy = packageRootFindLayerAdapterProxy();
  // No address: the manifest path is built off a real require.resolve() call, never mocked, so
  // its exact value is environment-dependent and unknowable at staging time — same rationale as
  // packageRootFindLayerAdapterProxy's own existsSync catch-all.
  const readFileHandle = registerMock({ fn: readFileSync });

  return {
    manifestDeclaresBin: ({ binRelative }: { binRelative: string }): void => {
      layerProxy.packageRootExists();
      readFileHandle
        .calledWith([])
        .returns(
          JSON.stringify({ name: '@dungeonmaster/cli', bin: { dungeonmaster: binRelative } }),
        );
    },

    manifestHasNoBinField: (): void => {
      layerProxy.packageRootExists();
      readFileHandle.calledWith([]).returns(JSON.stringify({ name: '@dungeonmaster/cli' }));
    },

    packageRootDoesNotExist: (): void => {
      layerProxy.packageRootDoesNotExist();
    },
  };
};
