/**
 * PURPOSE: Proxy for PrepareQuestPackageGraphLayerResponder — the layer is pure apart from one
 * manifest read per declared package, so this stages those reads by path. Nothing is staged in the
 * constructor: a catch-all would answer an unaddressed read and the layer's own degrade-on-throw
 * path would swallow it, turning a mis-staged test green.
 *
 * USAGE:
 * const proxy = PrepareQuestPackageGraphLayerResponderProxy();
 * proxy.setupManifest({ location: './packages/web', packageJson: { name: '@dm/web', dependencies: { '@dm/shared': '*' } } });
 * proxy.setupManifestUnreadable({ location: './packages/gone' });
 */

import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const PrepareQuestPackageGraphLayerResponderProxy = (): {
  setupManifest: (params: { location: string; packageJson: unknown }) => void;
  setupManifestUnreadable: (params: { location: string }) => void;
} => {
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupManifest: ({
      location,
      packageJson,
    }: {
      location: string;
      packageJson: unknown;
    }): void => {
      readFileProxy.resolves({
        filePath: FilePathStub({ value: `${location}/package.json` }),
        content: JSON.stringify(packageJson),
      });
    },

    setupManifestUnreadable: ({ location }: { location: string }): void => {
      readFileProxy.rejects({
        filePath: FilePathStub({ value: `${location}/package.json` }),
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
