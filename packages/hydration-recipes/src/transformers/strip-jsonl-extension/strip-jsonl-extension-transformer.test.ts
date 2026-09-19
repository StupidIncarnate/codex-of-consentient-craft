import { stripJsonlExtensionTransformer } from './strip-jsonl-extension-transformer';

describe('stripJsonlExtensionTransformer', () => {
  describe('a jsonl filename', () => {
    it('VALID: {filename: "seed-session-1.jsonl"} => returns "seed-session-1"', () => {
      const result = stripJsonlExtensionTransformer({ filename: 'seed-session-1.jsonl' });

      expect(result).toBe('seed-session-1');
    });

    it('VALID: {filename: "agent-seed-agent-1.jsonl"} => returns "agent-seed-agent-1"', () => {
      const result = stripJsonlExtensionTransformer({ filename: 'agent-seed-agent-1.jsonl' });

      expect(result).toBe('agent-seed-agent-1');
    });
  });
});
