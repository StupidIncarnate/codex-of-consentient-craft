
import { sourceConditionSupportedBroker } from './source-condition-supported-broker';
import { sourceConditionSupportedBrokerProxy } from './source-condition-supported-broker.proxy';

describe('sourceConditionSupportedBroker', () => {
  describe('barrel reachable', () => {
    it('VALID: {workspace package, barrel hoisted to the repo root} => true after walking past the folders without one', () => {
      const cwd = '/repo/packages/ward';
      const proxy = sourceConditionSupportedBrokerProxy();
      proxy.setupSupported({ cwd });

      const result = sourceConditionSupportedBroker({ cwd });

      expect(result).toBe(true);
    });

    it('VALID: {barrel in the project folder itself} => true', () => {
      const cwd = '/repo/packages/ward';
      const proxy = sourceConditionSupportedBrokerProxy();
      proxy.setupSupportedInProjectFolder({ cwd });

      const result = sourceConditionSupportedBroker({ cwd });

      expect(result).toBe(true);
    });
  });

  describe('barrel packed out of the install', () => {
    it("VALID: {consumer install, shared ships dist only} => false so ward never asks for a .ts that isn't there", () => {
      const cwd = '/home/dev/their-app';
      const proxy = sourceConditionSupportedBrokerProxy();
      proxy.setupUnsupported({ cwd });

      const result = sourceConditionSupportedBroker({ cwd });

      expect(result).toBe(false);
    });

    it('VALID: {single-segment project folder, no barrel} => false', () => {
      const cwd = '/app';
      const proxy = sourceConditionSupportedBrokerProxy();
      proxy.setupUnsupported({ cwd });

      const result = sourceConditionSupportedBroker({ cwd });

      expect(result).toBe(false);
    });
  });
});
