import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { checkSchemaBrandTextLayerBrokerProxy } from './check-schema-brand-text-layer-broker.proxy';
import { buildGatewayTypeDeclarationIndexLayerBrokerProxy } from './build-gateway-type-declaration-index-layer-broker.proxy';

export const ruleGatewaySchemaBrandBrokerProxy = (): {
  workspaceRoot: ReturnType<typeof workspaceRootFindBrokerProxy>;
  typeDeclarationIndex: ReturnType<typeof buildGatewayTypeDeclarationIndexLayerBrokerProxy>;
} => {
  // Real passthrough default: the rule reaches workspaceRootFindBroker through pathDirnameAdapter
  // directly (not only through the broker itself), so this satisfies enforce-proxy-child-creation
  // with no staging.
  pathDirnameAdapterProxy();
  checkSchemaBrandTextLayerBrokerProxy();

  return {
    workspaceRoot: workspaceRootFindBrokerProxy(),
    typeDeclarationIndex: buildGatewayTypeDeclarationIndexLayerBrokerProxy(),
  };
};
