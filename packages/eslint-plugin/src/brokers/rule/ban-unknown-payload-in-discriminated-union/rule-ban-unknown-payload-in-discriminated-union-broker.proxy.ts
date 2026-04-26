import { checkDiscriminatedUnionVariantsLayerBrokerProxy } from './check-discriminated-union-variants-layer-broker.proxy';

export const ruleBanUnknownPayloadInDiscriminatedUnionBrokerProxy = (): Record<
  PropertyKey,
  never
> => {
  checkDiscriminatedUnionVariantsLayerBrokerProxy();
  return {};
};
