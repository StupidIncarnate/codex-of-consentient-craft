/**
 * PURPOSE: Empty proxy for `opUpdateApplyLayerBroker`. Its I/O is INJECTED through the
 * ingredient's own `config.routes.update` function — a test supplies a real function over an
 * in-memory target, never a mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opUpdateApplyLayerBrokerProxy();
 */
import { opSetApplyLayerBrokerProxy } from './op-set-apply-layer-broker.proxy';

export const opUpdateApplyLayerBrokerProxy = (): Record<PropertyKey, never> => {
  opSetApplyLayerBrokerProxy();
  return {};
};
