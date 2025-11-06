import { UserPromptSubmitHookDataStub } from './user-prompt-submit-hook-data.stub';

describe('userPromptSubmitHookDataContract', () => {
  it('VALID: {default values} => parses successfully', () => {
    const result = UserPromptSubmitHookDataStub();

    expect(result.hook_event_name).toBe('UserPromptSubmit');
    expect(result.user_prompt).toBe('Test prompt');
    expect(result.session_id).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  });

  it('VALID: {custom prompt} => parses successfully', () => {
    const result = UserPromptSubmitHookDataStub({
      user_prompt: 'Create a new feature',
    });

    expect(result.user_prompt).toBe('Create a new feature');
  });
});
