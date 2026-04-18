import { isStatusMemberExpressionLayerBroker as implementation } from './is-status-member-expression-layer-broker';

export const isStatusMemberExpressionLayerBrokerProxy = (): {
  isStatusMemberExpressionLayerBroker: typeof implementation;
} => ({
  isStatusMemberExpressionLayerBroker: implementation,
});
