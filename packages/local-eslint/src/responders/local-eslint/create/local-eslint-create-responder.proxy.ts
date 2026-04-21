import { ruleBanQuestStatusLiteralsBrokerProxy } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker.proxy';
import { LocalEslintCreateResponder } from './local-eslint-create-responder';

export const LocalEslintCreateResponderProxy = (): {
  callResponder: typeof LocalEslintCreateResponder;
} => {
  ruleBanQuestStatusLiteralsBrokerProxy();

  return {
    callResponder: LocalEslintCreateResponder,
  };
};
