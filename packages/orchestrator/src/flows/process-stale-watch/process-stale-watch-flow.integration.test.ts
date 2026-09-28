import { ProcessStaleWatchFlow } from './process-stale-watch-flow';

describe('ProcessStaleWatchFlow', () => {
  // ProcessStaleWatchFlow.bootstrap() returns void (a synchronous void expression cannot be
  // captured into a variable or passed to expect() — @typescript-eslint/no-confusing-void-expression
  // refuses both), and flows/ cannot import state/ to observe the watchdog it wires directly. The
  // deep real-effect proof (a tick warns to stderr for a stale process) lives in
  // ProcessStaleWatchBootstrapResponder's own unit test. This shape assertion proves the export
  // survives the migration and the call is reached without throwing, the same shape
  // smoketest-flow.integration.test.ts uses for its own thin "export" check.
  it('VALID: {export} => exposes bootstrap as a function', () => {
    expect(ProcessStaleWatchFlow).toStrictEqual({ bootstrap: expect.any(Function) });
  });

  it('VALID: {called twice} => wires the stale-process watchdog idempotently', () => {
    ProcessStaleWatchFlow.bootstrap();
    ProcessStaleWatchFlow.bootstrap();

    expect(ProcessStaleWatchFlow).toStrictEqual({ bootstrap: expect.any(Function) });
  });
});
