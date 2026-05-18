import { activeMonitorSessionContract } from './active-monitor-session-contract';
import { ActiveMonitorSessionStub } from './active-monitor-session.stub';

describe('activeMonitorSessionContract', () => {
  it('VALID: {full object} => parses successfully', () => {
    const result = activeMonitorSessionContract.parse(ActiveMonitorSessionStub());

    expect(result).toStrictEqual(ActiveMonitorSessionStub());
  });

  it('INVALID: {missing parentSessionId} => throws', () => {
    expect(() =>
      activeMonitorSessionContract.parse({
        projectDir: '/repo',
        registeredAt: '2026-05-14T00:00:00.000Z',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing projectDir} => throws', () => {
    expect(() =>
      activeMonitorSessionContract.parse({
        parentSessionId: 'abc',
        registeredAt: '2026-05-14T00:00:00.000Z',
      }),
    ).toThrow(/Required/u);
  });

  it('INVALID: {missing registeredAt} => throws', () => {
    expect(() =>
      activeMonitorSessionContract.parse({
        parentSessionId: 'abc',
        projectDir: '/repo',
      }),
    ).toThrow(/Required/u);
  });
});
