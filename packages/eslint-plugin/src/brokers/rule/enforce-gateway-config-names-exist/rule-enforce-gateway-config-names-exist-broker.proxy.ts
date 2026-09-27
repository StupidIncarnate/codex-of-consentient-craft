import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { findWorkspaceRootLayerBrokerProxy } from './find-workspace-root-layer-broker.proxy';
import { checkGatewaySubpathExistsLayerBrokerProxy } from './check-gateway-subpath-exists-layer-broker.proxy';
import { checkGatewayExportNameExistsLayerBrokerProxy } from './check-gateway-export-name-exists-layer-broker.proxy';

export const ruleEnforceGatewayConfigNamesExistBrokerProxy = (): {
  setupWorkspaceRoot: (args: { rootDir: string; packageNames: string[] }) => void;
  setupBarrelExists: (args: { barrelPath: string; sourceText: string }) => void;
} => {
  // Real passthrough default: the rule itself calls pathDirnameAdapter directly (not only through
  // findWorkspaceRootLayerBroker), so this satisfies enforce-proxy-child-creation with no staging.
  pathDirnameAdapterProxy();
  const workspaceRootProxy = findWorkspaceRootLayerBrokerProxy();
  const subpathProxy = checkGatewaySubpathExistsLayerBrokerProxy();
  const exportNameProxy = checkGatewayExportNameExistsLayerBrokerProxy();

  return {
    setupWorkspaceRoot: (args: { rootDir: string; packageNames: string[] }): void => {
      workspaceRootProxy.setupWorkspaceRoot(args);
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
  };
};
