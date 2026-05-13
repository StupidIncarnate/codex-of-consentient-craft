import { ProcessStaleWatchFlow } from './process-stale-watch-flow';

describe('ProcessStaleWatchFlow', () => {
  it('VALID: {bootstrap} => returns success', () => {
    const result = ProcessStaleWatchFlow.bootstrap();

    expect(result).toStrictEqual({ success: true });
  });

  it('VALID: {bootstrap twice} => idempotent — both calls return success', () => {
    const first = ProcessStaleWatchFlow.bootstrap();
    const second = ProcessStaleWatchFlow.bootstrap();

    expect(first).toStrictEqual({ success: true });
    expect(second).toStrictEqual({ success: true });
  });
});
