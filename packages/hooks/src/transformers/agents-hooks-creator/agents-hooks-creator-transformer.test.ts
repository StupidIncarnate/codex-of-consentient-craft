import { agentsHooksCreatorTransformer } from './agents-hooks-creator-transformer';

describe('agentsHooksCreatorTransformer', () => {
  it('VALID: creates hooks config => returns PreToolUse and Stop configuration', () => {
    const result = agentsHooksCreatorTransformer();

    expect(result).toStrictEqual({
      'dungeonmaster-guard': {
        PreToolUse: [
          {
            matcher: 'run_command|replace_file_content|write_to_file|grep_search|find_by_name',
            hooks: [
              {
                type: 'command',
                command: 'dungeonmaster-agy-pre-tool',
              },
            ],
          },
        ],
        Stop: [
          {
            type: 'command',
            command: 'dungeonmaster-agy-stop',
          },
        ],
      },
    });
  });
});
