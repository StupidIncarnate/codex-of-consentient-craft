import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { checkGatewaySubpathExistsLayerBrokerProxy } from './check-gateway-subpath-exists-layer-broker.proxy';
import { checkGatewayExportNameExistsLayerBrokerProxy } from './check-gateway-export-name-exists-layer-broker.proxy';

// This rule never reads `rootPackageJsonName` — only `packageNames` — so callers of this proxy
// never need to supply one; the merged broker's own contract still requires a real string to build
// valid package.json fixture text, hence this fixed placeholder.
const PLACEHOLDER_ROOT_PACKAGE_JSON_NAME = 'dungeonmaster';

export const ruleEnforceGatewayConfigNamesExistBrokerProxy = (): {
  setupWorkspaceRoot: (args: { rootDir: string; packageNames: string[] }) => void;
  setupNoPackageJson: (args: { dir: string }) => void;
  setupBarrelExists: (args: { barrelPath: string; sourceText: string }) => void;
  setupBarrelMissing: (args: { barrelPath: string }) => void;
} => {
  // Real passthrough default: the rule itself calls pathDirnameAdapter directly (not only through
  // workspaceRootFindBroker), so this satisfies enforce-proxy-child-creation with no staging.
  pathDirnameAdapterProxy();
  const workspaceRootProxy = workspaceRootFindBrokerProxy();
  const subpathProxy = checkGatewaySubpathExistsLayerBrokerProxy();
  const exportNameProxy = checkGatewayExportNameExistsLayerBrokerProxy();

  return {
    setupWorkspaceRoot: ({
      rootDir,
      packageNames,
    }: {
      rootDir: string;
      packageNames: string[];
    }): void => {
      workspaceRootProxy.setupWorkspaceRoot({
        rootDir,
        packageNames,
        rootPackageJsonName: PLACEHOLDER_ROOT_PACKAGE_JSON_NAME,
      });
    },

    // existsSyncProxy (composed inside workspaceRootFindBrokerProxy) ships no address-less
    // catch-all: the anchor file's own directory sits several levels below the workspace root, so
    // every intermediate ancestor's package.json needs an explicit false stage too.
    setupNoPackageJson: ({ dir }: { dir: string }): void => {
      workspaceRootProxy.setupNoPackageJson({ dir });
    },

    // Stages a barrel that exists AND carries `sourceText` as its content, so both the subpath
    // check and the export-name check resolve through one call.
    setupBarrelExists: ({
      barrelPath,
      sourceText,
    }: {
      barrelPath: string;
      sourceText: string;
    }): void => {
      subpathProxy.setupBarrelExists({ barrelPath });
      exportNameProxy.setupBarrelSource({ barrelPath, sourceText });
    },

    // existsSyncProxy (composed inside checkGatewaySubpathExistsLayerBrokerProxy) ships no
    // address-less catch-all: a "not a real gateway subpath" scenario stages its own computed
    // barrel path explicitly false.
    setupBarrelMissing: ({ barrelPath }: { barrelPath: string }): void => {
      subpathProxy.setupBarrelMissing({ barrelPath });
    },
  };
};
