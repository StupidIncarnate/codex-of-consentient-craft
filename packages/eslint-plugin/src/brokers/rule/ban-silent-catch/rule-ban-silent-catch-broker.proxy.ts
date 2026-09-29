/**
 * PURPOSE: Provides mock setup for testing the ban-silent-catch rule broker
 *
 * USAGE:
 * const proxy = ruleBanSilentCatchBrokerProxy();
 * const context = proxy.createContext();
 */
import { RuleContextStub } from '#gateway/npm/typescript-eslint__utils/rule-context/rule-context.stub';
import { isSilentBodyLayerBrokerProxy } from './is-silent-body-layer-broker.proxy';
import type { TSESLint } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanSilentCatchBrokerProxy = (): {
  createContext: () => TSESLint.RuleContext<string, unknown[]>;
} => {
  isSilentBodyLayerBrokerProxy();

  return {
    createContext: (): TSESLint.RuleContext<string, unknown[]> => RuleContextStub(),
  };
};
