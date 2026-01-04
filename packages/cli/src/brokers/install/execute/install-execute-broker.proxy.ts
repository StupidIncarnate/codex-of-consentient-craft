import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

export const installExecuteBrokerProxy = (): {
  setupImport: ({ module }: { module: unknown }) => void;
} => ({
  setupImport: ({ module }: { module: unknown }) => {
    runtimeDynamicImportAdapterProxy({ module });
  },
});
