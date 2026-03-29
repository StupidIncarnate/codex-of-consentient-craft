import { userPromptSubmitHookDataContract } from './user-prompt-submit-hook-data-contract';
import { UserPromptSubmitHookDataStub } from './user-prompt-submit-hook-data.stub';

describe('userPromptSubmitHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = UserPromptSubmitHookDataStub();

    expect(result).toStrictEqual({
      hook_event_name: 'UserPromptSubmit',
      user_prompt: 'Test prompt',
      session_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      transcript_path: '/tmp/transcript.jsonl',
      cwd: result.cwd,
    });
  });

  it('VALID: {custom prompt} => parses successfully', () => {
    const result = UserPromptSubmitHookDataStub({
      user_prompt: 'Create a new feature',
    });

    expect(result.user_prompt).toBe('Create a new feature');
  });

  describe('invalid input', () => {
    it('INVALID: {invalid data} => throws validation error', () => {
      expect(() => {
        return userPromptSubmitHookDataContract.parse({} as never);
      }).toThrow(/Required/u);
    });
  });
});
