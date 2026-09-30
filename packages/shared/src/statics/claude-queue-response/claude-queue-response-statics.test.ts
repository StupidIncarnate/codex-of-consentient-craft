import { claudeQueueResponseStatics } from './claude-queue-response-statics';

describe('claudeQueueResponseStatics', () => {
  it('VALID: full statics => contains the exit code upper bound', () => {
    expect(claudeQueueResponseStatics).toStrictEqual({
      exitCode: {
        max: 255,
      },
    });
  });
});
