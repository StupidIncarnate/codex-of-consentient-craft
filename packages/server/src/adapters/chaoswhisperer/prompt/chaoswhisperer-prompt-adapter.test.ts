import { chaoswhispererPromptAdapterProxy } from './chaoswhisperer-prompt-adapter.proxy';
import { chaoswhispererPromptAdapter } from './chaoswhisperer-prompt-adapter';

describe('chaoswhispererPromptAdapter', () => {
  describe('prompt retrieval', () => {
    it('VALID: {} => returns template and argumentsPlaceholder', () => {
      const proxy = chaoswhispererPromptAdapterProxy();
      proxy.setup();

      const result = chaoswhispererPromptAdapter();

      expect(result).toStrictEqual({
        template: 'default-template {{ARGUMENTS}}',
        argumentsPlaceholder: '{{ARGUMENTS}}',
      });
    });
  });
});
