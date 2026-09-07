import { findSharedPackageRootLayerAdapterProxy } from './find-shared-package-root-layer-adapter.proxy';

export const sharedPackageResolveAdapterProxy = (): {
  packageRootExists: () => void;
  packageRootDoesNotExist: () => void;
  srcExists: () => void;
  srcDoesNotExist: () => void;
} => {
  const layerProxy = findSharedPackageRootLayerAdapterProxy();

  return {
    packageRootExists: (): void => {
      layerProxy.packageRootExists();
    },

    packageRootDoesNotExist: (): void => {
      layerProxy.packageRootDoesNotExist();
    },

    // Backwards-compatible aliases
    srcExists: (): void => {
      layerProxy.packageRootExists();
    },

    srcDoesNotExist: (): void => {
      layerProxy.packageRootDoesNotExist();
    },
  };
};
