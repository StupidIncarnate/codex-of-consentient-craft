import { FakeAgentCliRequiredError } from './fake-agent-cli-required-error';

describe('FakeAgentCliRequiredError', () => {
  describe('constructor()', () => {
    it('VALID: {specName, missing: [CLAUDE_CLI_PATH, WARD_CLI_PATH]} => sets name and full message', () => {
      const error = new FakeAgentCliRequiredError({
        specName: 'dungeonmaster-api',
        missing: [
          { name: 'CLAUDE_CLI_PATH', hint: 'a stub Claude CLI binary' },
          { name: 'WARD_CLI_PATH', hint: 'a stub dungeonmaster-ward CLI binary' },
        ],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'FakeAgentCliRequiredError',
        message:
          'Lane spec dungeonmaster-api requires a fake agent CLI, and the environment ' +
          'supplies none of it: set CLAUDE_CLI_PATH to a stub Claude CLI binary; set WARD_CLI_PATH ' +
          'to a stub dungeonmaster-ward CLI binary. Refusing to boot against the real CLI — that ' +
          'spends real API usage and produces a non-deterministic reading.',
      });
    });

    it('EDGE: {missing: [WARD_CLI_PATH]} => names only the one variable still missing', () => {
      const error = new FakeAgentCliRequiredError({
        specName: 'dungeonmaster-stack',
        missing: [{ name: 'WARD_CLI_PATH', hint: 'a stub dungeonmaster-ward CLI binary' }],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'FakeAgentCliRequiredError',
        message:
          'Lane spec dungeonmaster-stack requires a fake agent CLI, and the environment supplies ' +
          'none of it: set WARD_CLI_PATH to a stub dungeonmaster-ward CLI binary. Refusing to boot ' +
          'against the real CLI — that spends real API usage and produces a non-deterministic reading.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof FakeAgentCliRequiredError => returns true', () => {
      const error = new FakeAgentCliRequiredError({
        specName: 'dungeonmaster-api',
        missing: [{ name: 'CLAUDE_CLI_PATH', hint: 'a stub Claude CLI binary' }],
      });

      expect(error instanceof FakeAgentCliRequiredError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new FakeAgentCliRequiredError({
        specName: 'dungeonmaster-api',
        missing: [{ name: 'CLAUDE_CLI_PATH', hint: 'a stub Claude CLI binary' }],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
