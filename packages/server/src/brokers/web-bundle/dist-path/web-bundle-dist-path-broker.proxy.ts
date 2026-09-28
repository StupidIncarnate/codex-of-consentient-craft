import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { resolvePackageRoot } from '#gateway/node/module';
import { resolvePackageRootProxy } from '#gateway/node/module/resolve-package-root/resolve-package-root.proxy';
import { join } from '#gateway/node/path';

const WEB_PACKAGE_NAME = '@dungeonmaster/web';

export const webBundleDistPathBrokerProxy = (): {
  bundleExists: () => void;
  bundleMissing: () => void;
} => {
  // resolvePackageRoot has no mocking hook (a real require.resolve walk — see its own proxy's
  // header) and always runs for real, the same way the deleted adapter's own require.resolve did.
  resolvePackageRootProxy();
  const existsProxy = existsSyncProxy();

  // The ONLY existsSync call this broker can really make is against the REAL dist path for
  // @dungeonmaster/web — the one package every real caller (webBundleResponseBroker, via
  // webBundlePackageResolveBroker) resolves this with. Staging here by that real address, rather
  // than the address-less catch-all the deleted adapter's own proxy used, means a broker that
  // somehow computed a DIFFERENT path calls existsSync with an address nothing here answers,
  // instead of silently matching regardless of path.
  const packageRoot = resolvePackageRoot({ specifier: `${WEB_PACKAGE_NAME}/package.json` });
  const realDistPath = packageRoot === null ? null : join(packageRoot, 'dist');

  return {
    bundleExists: (): void => {
      if (realDistPath === null) {
        throw new Error(
          'webBundleDistPathBrokerProxy: resolvePackageRoot found no @dungeonmaster/web — is it installed?',
        );
      }
      existsProxy.returns({ path: realDistPath, exists: true });
    },
    bundleMissing: (): void => {
      if (realDistPath === null) {
        throw new Error(
          'webBundleDistPathBrokerProxy: resolvePackageRoot found no @dungeonmaster/web — is it installed?',
        );
      }
      existsProxy.returns({ path: realDistPath, exists: false });
    },
  };
};
