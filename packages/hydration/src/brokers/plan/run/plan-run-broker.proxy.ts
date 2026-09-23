/**
 * PURPOSE: Composes every child proxy `planRunBroker` reaches, each one empty — there is nothing to
 * mock anywhere in this chain. The runner's I/O is INJECTED through the ingredient's own `routes`,
 * so a unit test hands it real functions over an in-memory target rather than a mock, and this suite
 * runs completely real.
 *
 * USAGE:
 * planRunBrokerProxy();
 */
import { planPreflightBrokerProxy } from '../preflight/plan-preflight-broker.proxy';
import { opCreateApplyLayerBrokerProxy } from './op-create-apply-layer-broker.proxy';
import { opSaveRecordApplyLayerBrokerProxy } from './op-save-record-apply-layer-broker.proxy';
import { opRemoveApplyLayerBrokerProxy } from './op-remove-apply-layer-broker.proxy';
import { opExtraApplyLayerBrokerProxy } from './op-extra-apply-layer-broker.proxy';
import { opSetApplyLayerBrokerProxy } from './op-set-apply-layer-broker.proxy';
import { opUpdateApplyLayerBrokerProxy } from './op-update-apply-layer-broker.proxy';
import { opFilterApplyLayerBrokerProxy } from './op-filter-apply-layer-broker.proxy';
import { opAttachApplyLayerBrokerProxy } from './op-attach-apply-layer-broker.proxy';

export const planRunBrokerProxy = (): Record<PropertyKey, never> => {
  planPreflightBrokerProxy();
  opCreateApplyLayerBrokerProxy();
  opSaveRecordApplyLayerBrokerProxy();
  opRemoveApplyLayerBrokerProxy();
  opExtraApplyLayerBrokerProxy();
  opSetApplyLayerBrokerProxy();
  opUpdateApplyLayerBrokerProxy();
  opFilterApplyLayerBrokerProxy();
  opAttachApplyLayerBrokerProxy();
  return {};
};
