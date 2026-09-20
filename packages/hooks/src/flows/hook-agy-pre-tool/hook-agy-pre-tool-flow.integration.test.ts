import { discoverSuggestionMessageStatics } from '../../statics/discover-suggestion-message/discover-suggestion-message-statics';
import { HookAgyPreToolFlow } from './hook-agy-pre-tool-flow';

describe('HookAgyPreToolFlow', () => {
  it('VALID: {inputData: allowed command JSON} => returns exitCode 0 with allow decision', async () => {
    const inputData = JSON.stringify({
      toolCall: {
        name: 'run_command',
        args: { CommandLine: 'git status' },
      },
    });

    const result = await HookAgyPreToolFlow({ inputData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'allow' }),
      stderr: '',
    });
  });

  it('VALID: {inputData: blocked search JSON} => returns exitCode 0 with deny decision', async () => {
    const inputData = JSON.stringify({
      toolCall: {
        name: 'grep_search',
        args: { Query: 'pattern' },
      },
    });

    const result = await HookAgyPreToolFlow({ inputData });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({
        decision: 'deny',
        reason: discoverSuggestionMessageStatics.blockMessage,
      }),
      stderr: '',
    });
  });

  it('INVALID: {inputData: invalid JSON} => falls back to allow gracefully', async () => {
    const result = await HookAgyPreToolFlow({ inputData: 'invalid json' });

    expect(result).toStrictEqual({
      exitCode: 0,
      stdout: JSON.stringify({ decision: 'allow' }),
      stderr: '',
    });
  });
});
