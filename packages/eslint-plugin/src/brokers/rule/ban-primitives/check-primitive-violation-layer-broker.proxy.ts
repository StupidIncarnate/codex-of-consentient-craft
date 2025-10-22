import { checkPrimitiveViolationLayerBroker as implementation } from './check-primitive-violation-layer-broker';

export const checkPrimitiveViolationLayerBrokerProxy = (): {
  checkPrimitiveViolationLayerBroker: typeof implementation;
} => ({
  checkPrimitiveViolationLayerBroker: implementation,
});
