import { hookConfigMergeBroker } from './hook-config-merge-broker';
import { hookConfigMergeBrokerProxy } from './hook-config-merge-broker.proxy';
import { PreEditLintConfigStub } from '../../../contracts/pre-edit-lint-config/pre-edit-lint-config.stub';

describe('hookConfigMergeBroker', () => {
  describe('valid input', () => {
    it('VALID: {config: {rules: ["custom-rule"]}} => returns config with custom rules', () => {
      hookConfigMergeBrokerProxy();
      const config = PreEditLintConfigStub({
        rules: ['custom-rule'],
      });

      const result = hookConfigMergeBroker({ config });

      expect(result).toStrictEqual({
        rules: ['custom-rule'],
      });
    });

    it('VALID: {config: {rules: []}} => returns defaults from plugin', () => {
      hookConfigMergeBrokerProxy();
      const config = PreEditLintConfigStub({
        rules: [],
      });

      const result = hookConfigMergeBroker({ config });

      expect(result.rules.length).toBeGreaterThan(30);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {config: {rules: []}} with empty array => returns default rules', () => {
      hookConfigMergeBrokerProxy();
      const config = PreEditLintConfigStub({
        rules: [],
      });

      const result = hookConfigMergeBroker({ config });

      expect(result.rules.length).toBeGreaterThan(30);
    });
  });
});
