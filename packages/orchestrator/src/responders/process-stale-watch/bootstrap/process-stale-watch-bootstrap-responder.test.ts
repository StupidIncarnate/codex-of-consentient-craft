import { ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { OrchestrationProcessStub } from '../../../contracts/orchestration-process/orchestration-process.stub';
import { ProcessStaleWatchBootstrapResponder } from './process-stale-watch-bootstrap-responder';
import { ProcessStaleWatchBootstrapResponderProxy } from './process-stale-watch-bootstrap-responder.proxy';

const NINETY_SECONDS_MS = 90_000;

describe('ProcessStaleWatchBootstrapResponder', () => {
  it('VALID: {a registered process goes silent past the threshold} => a tick warns to stderr', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T22:58:24.835Z'));
    const proxy = ProcessStaleWatchBootstrapResponderProxy();
    proxy.reset();
    const processId = ProcessIdStub({ value: 'proc-stale-bootstrap' });
    proxy.registerProcess({
      orchestrationProcess: OrchestrationProcessStub({ processId, kill: jest.fn() }),
    });
    jest.setSystemTime(new Date(Date.now() + NINETY_SECONDS_MS));

    ProcessStaleWatchBootstrapResponder();
    proxy.triggerTick();
    jest.useRealTimers();

    expect(proxy.stderrLines()).toStrictEqual([
      [`[dev] WARN stale  proc:${processId}  silentFor:90s  pid:?\n`],
    ]);
  });

  it('VALID: {second call} => idempotent — no duplicate watchdog, still exactly one warning per tick', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T22:58:24.835Z'));
    const proxy = ProcessStaleWatchBootstrapResponderProxy();
    proxy.reset();
    const processId = ProcessIdStub({ value: 'proc-stale-bootstrap-idempotent' });
    proxy.registerProcess({
      orchestrationProcess: OrchestrationProcessStub({ processId, kill: jest.fn() }),
    });
    jest.setSystemTime(new Date(Date.now() + NINETY_SECONDS_MS));

    ProcessStaleWatchBootstrapResponder();
    ProcessStaleWatchBootstrapResponder();
    proxy.triggerTick();
    jest.useRealTimers();

    expect(proxy.stderrLines()).toStrictEqual([
      [`[dev] WARN stale  proc:${processId}  silentFor:90s  pid:?\n`],
    ]);
  });
});
