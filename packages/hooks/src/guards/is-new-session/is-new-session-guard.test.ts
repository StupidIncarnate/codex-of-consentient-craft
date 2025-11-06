import { isNewSessionGuard } from './is-new-session-guard';

describe('isNewSessionGuard', () => {
  it('VALID: fileSize is not provided => returns true', () => {
    const result = isNewSessionGuard({});

    expect(result).toBe(true);
  });

  it('VALID: fileSize is 0 => returns true', () => {
    const result = isNewSessionGuard({ fileSize: 0 });

    expect(result).toBe(true);
  });

  it('VALID: fileSize < 1024 (500 bytes) => returns true', () => {
    const result = isNewSessionGuard({ fileSize: 500 });

    expect(result).toBe(true);
  });

  it('VALID: fileSize < 1024 (1023 bytes) => returns true', () => {
    const result = isNewSessionGuard({ fileSize: 1023 });

    expect(result).toBe(true);
  });

  it('VALID: fileSize >= 1024 (exactly 1024) => returns false', () => {
    const result = isNewSessionGuard({ fileSize: 1024 });

    expect(result).toBe(false);
  });

  it('VALID: fileSize >= 1024 (2048 bytes) => returns false', () => {
    const result = isNewSessionGuard({ fileSize: 2048 });

    expect(result).toBe(false);
  });

  it('VALID: fileSize is large => returns false', () => {
    const result = isNewSessionGuard({ fileSize: 10000 });

    expect(result).toBe(false);
  });
});
