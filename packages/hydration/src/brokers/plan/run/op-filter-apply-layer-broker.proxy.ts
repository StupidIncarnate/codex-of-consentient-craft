/**
 * PURPOSE: Empty proxy for `opFilterApplyLayerBroker`. Its I/O is INJECTED through the
 * ingredient's own `config.routes.query` function — a test supplies a real function over an
 * in-memory target, never a mock, so there is no boundary here for `registerMock` to address.
 *
 * USAGE:
 * opFilterApplyLayerBrokerProxy();
 */
import { opCreateApplyLayerBrokerProxy } from './op-create-apply-layer-broker.proxy';
import { opSetApplyLayerBrokerProxy } from './op-set-apply-layer-broker.proxy';
import { opUpdateApplyLayerBrokerProxy } from './op-update-apply-layer-broker.proxy';
import { opRemoveApplyLayerBrokerProxy } from './op-remove-apply-layer-broker.proxy';
import { opSaveRecordApplyLayerBrokerProxy } from './op-save-record-apply-layer-broker.proxy';
import { opExtraApplyLayerBrokerProxy } from './op-extra-apply-layer-broker.proxy';

export const opFilterApplyLayerBrokerProxy = (): Record<PropertyKey, never> => {
  opCreateApplyLayerBrokerProxy();
  opSetApplyLayerBrokerProxy();
  opUpdateApplyLayerBrokerProxy();
  opRemoveApplyLayerBrokerProxy();
  opSaveRecordApplyLayerBrokerProxy();
  opExtraApplyLayerBrokerProxy();
  return {};
};
