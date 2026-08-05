import { claudeSessionScanStatics } from './claude-session-scan-statics';

describe('claudeSessionScanStatics', () => {
  it('VALID: exported value => matches the full expected object', () => {
    expect(claudeSessionScanStatics).toStrictEqual({
      maxAttempts: 30,
      retryDelayMs: 100,
    });
  });
});
