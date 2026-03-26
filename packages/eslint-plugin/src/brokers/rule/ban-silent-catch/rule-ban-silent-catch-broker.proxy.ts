/**
 * PURPOSE: Provides mock setup for testing the ban-silent-catch rule broker
 *
 * USAGE:
 * const proxy = ruleBanSilentCatchBrokerProxy();
 * const context = proxy.createContext();
 */
import { isSilentBodyLayerBrokerProxy } from './is-silent-body-layer-broker.proxy';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';

export const ruleBanSilentCatchBrokerProxy = (): {
  createContext: () => EslintContext;
} => {
  isSilentBodyLayerBrokerProxy();

  return {
    createContext: (): EslintContext => ({
      filename: undefined,
      report: jest.fn(),
    }),
  };
};
