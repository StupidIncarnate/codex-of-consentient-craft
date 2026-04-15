/**
 * PURPOSE: Test setup helper for server init responder
 *
 * USAGE:
 * const proxy = ServerInitResponderProxy();
 * proxy.setupConstraintFiles({ 'brokers-constraints.md': ContentTextStub() });
 * await proxy.callResponder();
 */

import { folderConstraintsInitBrokerProxy } from '../../../brokers/folder-constraints/init/folder-constraints-init-broker.proxy';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { ServerInitResponder } from './server-init-responder';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const ServerInitResponderProxy = (): {
  callResponder: typeof ServerInitResponder;
  setupConstraintFiles: (params: Record<PathSegment, ContentText>) => void;
} => {
  const brokerProxy = folderConstraintsInitBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();

  return {
    callResponder: ServerInitResponder,

    setupConstraintFiles: (files: Record<PathSegment, ContentText>): void => {
      brokerProxy.setupConstraintFiles(files);
    },
  };
};
