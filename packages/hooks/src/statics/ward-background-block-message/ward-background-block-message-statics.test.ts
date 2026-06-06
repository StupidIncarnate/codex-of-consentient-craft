import { wardBackgroundBlockMessageStatics } from './ward-background-block-message-statics';

describe('wardBackgroundBlockMessageStatics', () => {
  it('VALID: exports the background-ward block message', () => {
    expect(wardBackgroundBlockMessageStatics).toStrictEqual({
      blockMessage:
        'BLOCKED: Do not run ward in the background. A backgrounded ward run gives no reliable completion signal — the agent ends up sleep-polling a file that never updates. Run ward in the FOREGROUND with `timeout: 600000` and wait for it to finish.',
    });
  });
});
