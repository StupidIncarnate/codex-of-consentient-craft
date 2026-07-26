/**
 * PURPOSE: Test setup helper for server init responder
 *
 * USAGE:
 * const proxy = ServerInitResponderProxy();
 * await proxy.callResponder();
 */

import { folderConstraintsInitBrokerProxy } from '../../../brokers/folder-constraints/init/folder-constraints-init-broker.proxy';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { ServerInitResponder } from './server-init-responder';

export const ServerInitResponderProxy = (): {
  callResponder: typeof ServerInitResponder;
} => {
  folderConstraintsInitBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();

  return {
    callResponder: ServerInitResponder,
  };
};
