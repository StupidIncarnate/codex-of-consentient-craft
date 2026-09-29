import { claudeSpawnCommandContract } from './claude-spawn-command-contract';
import { ClaudeSpawnCommandStub } from './claude-spawn-command.stub';

describe('claudeSpawnCommandContract', () => {
  it('VALID: {default} => parses the stub argv and env', () => {
    const command = ClaudeSpawnCommandStub();

    expect(command).toStrictEqual({
      args: ['-p', 'You are an AI assistant.'],
      env: { CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '0' },
    });
  });

  it('VALID: {args and env overridden} => keeps the overrides', () => {
    const command = ClaudeSpawnCommandStub({ args: ['-p', 'Hello'], env: { PATH: '/usr/bin' } });

    expect(command).toStrictEqual({ args: ['-p', 'Hello'], env: { PATH: '/usr/bin' } });
  });

  it('INVALID: {env value not a string} => throws validation error', () => {
    expect(() => claudeSpawnCommandContract.parse({ args: ['-p'], env: { PATH: 5 } })).toThrow(
      /expected string, received number/u,
    );
  });
});
