import { activeMonitorSessionContract } from './active-monitor-session-contract';
import { ActiveMonitorSessionStub } from './active-monitor-session.stub';

describe('activeMonitorSessionContract', () => {
  describe('valid input', () => {
    it('VALID: {parentSessionId, projectDir, registeredAt} => parses', () => {
      const result = activeMonitorSessionContract.parse(ActiveMonitorSessionStub());

      expect(result).toStrictEqual({
        parentSessionId: 'abc-123-def-456',
        projectDir: '/home/user/my-project',
        registeredAt: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {custom parentSessionId} => parses with override', () => {
      const result = activeMonitorSessionContract.parse(
        ActiveMonitorSessionStub({ parentSessionId: 'override-id' }),
      );

      expect(result).toStrictEqual({
        parentSessionId: 'override-id',
        projectDir: '/home/user/my-project',
        registeredAt: '2024-01-15T10:00:00.000Z',
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {parentSessionId: ""} => throws', () => {
      expect(() =>
        activeMonitorSessionContract.parse({
          parentSessionId: '',
          projectDir: '/home/user/p',
          registeredAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/at least 1/u);
    });

    it('INVALID: {projectDir: ""} => throws', () => {
      expect(() =>
        activeMonitorSessionContract.parse({
          parentSessionId: 'abc',
          projectDir: '',
          registeredAt: '2024-01-15T10:00:00.000Z',
        }),
      ).toThrow(/at least 1/u);
    });

    it('INVALID: {registeredAt: ""} => throws', () => {
      expect(() =>
        activeMonitorSessionContract.parse({
          parentSessionId: 'abc',
          projectDir: '/home/user/p',
          registeredAt: '',
        }),
      ).toThrow(/at least 1/u);
    });
  });
});
