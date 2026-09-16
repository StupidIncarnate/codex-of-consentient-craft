import { fakeAgentCliStatics } from './fake-agent-cli-statics';

describe('fakeAgentCliStatics', () => {
  describe('the required env vars', () => {
    it('VALID: {fakeAgentCliStatics.requiredEnvVars} => names CLAUDE_CLI_PATH and WARD_CLI_PATH, each with a hint', () => {
      expect(fakeAgentCliStatics.requiredEnvVars).toStrictEqual([
        { name: 'CLAUDE_CLI_PATH', hint: 'a stub Claude CLI binary' },
        { name: 'WARD_CLI_PATH', hint: 'a stub dungeonmaster-ward CLI binary' },
      ]);
    });
  });
});
