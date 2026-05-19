import { registerMonitorSessionResultContract } from './register-monitor-session-result-contract';
import { RegisterMonitorSessionResultStub } from './register-monitor-session-result.stub';

describe('registerMonitorSessionResultContract', () => {
  describe('valid results', () => {
    it('VALID: {default stub} => parses with zero orphans', () => {
      const result = RegisterMonitorSessionResultStub();

      expect(result).toStrictEqual({
        status: 'registered',
        orphansReset: 0,
      });
    });

    it('VALID: {orphansReset: 5} => parses', () => {
      const result = RegisterMonitorSessionResultStub({ orphansReset: 5 as never });

      expect(result).toStrictEqual({
        status: 'registered',
        orphansReset: 5,
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {status: pending} => throws', () => {
      expect(() =>
        registerMonitorSessionResultContract.parse({
          status: 'pending',
          orphansReset: 0,
        }),
      ).toThrow(/registered/u);
    });

    it('INVALID: {negative orphansReset} => throws', () => {
      expect(() =>
        registerMonitorSessionResultContract.parse({
          status: 'registered',
          orphansReset: -1,
        }),
      ).toThrow(/greater than or equal/u);
    });

    it('INVALID: {float orphansReset} => throws', () => {
      expect(() =>
        registerMonitorSessionResultContract.parse({
          status: 'registered',
          orphansReset: 1.5,
        }),
      ).toThrow(/integer/u);
    });
  });
});
