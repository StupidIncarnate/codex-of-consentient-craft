/**
 * PURPOSE: The caller-supplied environment variables `lane-boot-broker` checks for before booting
 * a spec whose `requiresFakeAgentCli` is true — `CLAUDE_CLI_PATH` and `WARD_CLI_PATH`, with their
 * in-repo fixture relative paths when running in the dungeonmaster repo. Without one of these set
 * or found on disk, the api process a spec spawns talks to the REAL `claude`/`dungeonmaster-ward`
 * binaries: real API spend, and a non-deterministic reading. `hint` is folded into
 * `FakeAgentCliRequiredError`'s message, which imports nothing of its own.
 *
 * USAGE:
 * fakeAgentCliStatics.requiredEnvVars[0].name;
 * // Returns 'CLAUDE_CLI_PATH'
 */

export const fakeAgentCliStatics = {
  requiredEnvVars: [
    {
      name: 'CLAUDE_CLI_PATH',
      hint: 'a stub Claude CLI binary',
      fixtureRelativePath: [
        'packages',
        'web',
        'test',
        'harnesses',
        'claude-mock',
        'bin',
        'claude',
      ].join('/'),
    },
    {
      name: 'WARD_CLI_PATH',
      hint: 'a stub dungeonmaster-ward CLI binary',
      fixtureRelativePath: 'packages/orchestrator/test-fixtures/fake-ward-bin/dungeonmaster-ward',
    },
  ],
} as const;
