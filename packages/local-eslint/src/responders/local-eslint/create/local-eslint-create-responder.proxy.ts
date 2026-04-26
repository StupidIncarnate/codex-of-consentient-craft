import { ruleBanQuestStatusLiteralsBrokerProxy } from '../../../brokers/rule/ban-quest-status-literals/rule-ban-quest-status-literals-broker.proxy';
import { ruleNoBareLocationLiteralsBrokerProxy } from '../../../brokers/rule/no-bare-location-literals/rule-no-bare-location-literals-broker.proxy';
import { LocalEslintCreateResponder } from './local-eslint-create-responder';

export const LocalEslintCreateResponderProxy = (): {
  callResponder: typeof LocalEslintCreateResponder;
} => {
  ruleBanQuestStatusLiteralsBrokerProxy();
  ruleNoBareLocationLiteralsBrokerProxy();

  return {
    callResponder: LocalEslintCreateResponder,
  };
};
