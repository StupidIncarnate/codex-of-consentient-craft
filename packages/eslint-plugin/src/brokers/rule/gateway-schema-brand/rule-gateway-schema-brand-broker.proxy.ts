import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { checkSchemaBrandTextLayerBrokerProxy } from './check-schema-brand-text-layer-broker.proxy';
import { buildGatewayTypeDeclarationIndexLayerBrokerProxy } from './build-gateway-type-declaration-index-layer-broker.proxy';

export const ruleGatewaySchemaBrandBrokerProxy = (): {
  workspaceRoot: ReturnType<typeof workspaceRootFindBrokerProxy>;
  typeDeclarationIndex: ReturnType<typeof buildGatewayTypeDeclarationIndexLayerBrokerProxy>;
} => {
  checkSchemaBrandTextLayerBrokerProxy();

  return {
    workspaceRoot: workspaceRootFindBrokerProxy(),
    typeDeclarationIndex: buildGatewayTypeDeclarationIndexLayerBrokerProxy(),
  };
};
