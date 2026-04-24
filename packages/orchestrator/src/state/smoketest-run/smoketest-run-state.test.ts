import { SmoketestRunIdStub, SmoketestSuiteStub } from '@dungeonmaster/shared/contracts';

import { smoketestRunState } from './smoketest-run-state';

describe('smoketestRunState', () => {
  it('VALID: {no run started} => getActive returns null and getRecentEvents is empty', () => {
    smoketestRunState.end();

    expect({
      active: smoketestRunState.getActive(),
      events: smoketestRunState.getRecentEvents(),
    }).toStrictEqual({ active: null, events: [] });
  });

  it('VALID: {start then getActive} => returns ActiveSmoketestRun with the supplied runId and suite', () => {
    smoketestRunState.end();
    const runId = SmoketestRunIdStub();
    const suite = SmoketestSuiteStub({ value: 'mcp' });

    smoketestRunState.start({ runId, suite });
    const active = smoketestRunState.getActive();
    smoketestRunState.end();

    expect({ runId: active?.runId, suite: active?.suite }).toStrictEqual({ runId, suite });
  });

  it('VALID: {isActive before start} => returns false', () => {
    smoketestRunState.end();

    expect(smoketestRunState.isActive()).toBe(false);
  });

  it('VALID: {isActive after start} => returns true until end', () => {
    smoketestRunState.end();

    smoketestRunState.start({
      runId: SmoketestRunIdStub(),
      suite: SmoketestSuiteStub({ value: 'mcp' }),
    });
    const whileActive = smoketestRunState.isActive();
    smoketestRunState.end();
    const afterEnd = smoketestRunState.isActive();

    expect({ whileActive, afterEnd }).toStrictEqual({ whileActive: true, afterEnd: false });
  });

  it('VALID: {appendEvent} => events show up in getRecentEvents', () => {
    smoketestRunState.end();
    const runId = SmoketestRunIdStub();
    const suite = SmoketestSuiteStub({ value: 'signals' });

    smoketestRunState.start({ runId, suite });
    smoketestRunState.appendEvent({ event: { phase: 'started' } });
    smoketestRunState.appendEvent({ event: { phase: 'case-started' } });
    const events = smoketestRunState.getRecentEvents();
    smoketestRunState.end();

    expect(events).toStrictEqual([{ phase: 'started' }, { phase: 'case-started' }]);
  });
});
