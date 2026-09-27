import { ClaudeNotInstalledError } from './claude-not-installed-error';

describe('ClaudeNotInstalledError', () => {
  it('VALID: {message: "claude missing"} => is an Error carrying that message', () => {
    const error = new ClaudeNotInstalledError('claude missing');

    expect(error instanceof Error).toBe(true);
    expect(error.message).toBe('claude missing');
  });
});
