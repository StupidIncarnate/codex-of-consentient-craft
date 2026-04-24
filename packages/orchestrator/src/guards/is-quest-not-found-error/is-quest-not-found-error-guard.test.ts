import { isQuestNotFoundErrorGuard } from './is-quest-not-found-error-guard';

describe('isQuestNotFoundErrorGuard', () => {
  it('VALID: {error with "not found in any guild" message} => returns true', () => {
    const error = new Error('Quest with id "abc" not found in any guild');

    const result = isQuestNotFoundErrorGuard({ error });

    expect(result).toBe(true);
  });

  it('VALID: {unrelated Error} => returns false', () => {
    const error = new Error('ENOENT: file not found');

    const result = isQuestNotFoundErrorGuard({ error });

    expect(result).toBe(false);
  });

  it('VALID: {non-Error value (string)} => returns false', () => {
    const result = isQuestNotFoundErrorGuard({ error: 'not found in any guild' });

    expect(result).toBe(false);
  });

  it('VALID: {non-Error value (null)} => returns false', () => {
    const result = isQuestNotFoundErrorGuard({ error: null });

    expect(result).toBe(false);
  });

  it('VALID: {no argument} => returns false', () => {
    const result = isQuestNotFoundErrorGuard({});

    expect(result).toBe(false);
  });
});
