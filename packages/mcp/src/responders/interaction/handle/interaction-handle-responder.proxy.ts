/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
} => {
  signalBackBrokerProxy();
  askUserQuestionBrokerProxy();

  return {
    callResponder: InteractionHandleResponder,
  };
};
