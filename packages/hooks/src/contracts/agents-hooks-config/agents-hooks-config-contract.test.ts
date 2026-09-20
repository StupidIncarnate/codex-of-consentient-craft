import { agentsHooksConfigContract } from './agents-hooks-config-contract';
import { AgentsHooksConfigStub } from './agents-hooks-config.stub';

describe('agentsHooksConfigContract', () => {
  it('VALID: {default stub} => parses successfully', () => {
    const result = AgentsHooksConfigStub();

    expect(result).toStrictEqual({
      'dungeonmaster-guard': {
        PreToolUse: [
          {
            matcher: 'run_command',
            hooks: [{ type: 'command', command: 'dungeonmaster-agy-pre-tool' }],
          },
        ],
        Stop: [{ type: 'command', command: 'dungeonmaster-agy-stop' }],
      },
    });
  });

  it('INVALID: {missing dungeonmaster-guard} => throws validation error', () => {
    expect(() => {
      return agentsHooksConfigContract.parse({} as never);
    }).toThrow(/Required/u);
  });
});
