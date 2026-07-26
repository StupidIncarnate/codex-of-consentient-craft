import { jestRegisterSpyOnAdapter } from './jest-register-spy-on-adapter';
import { jestRegisterSpyOnAdapterProxy } from './jest-register-spy-on-adapter.proxy';

describe('jestRegisterSpyOnAdapter', () => {
  describe('basic spy', () => {
    it('VALID: {object: process.stdout, method: write} => intercepts calls and tracks them', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.calledWith([]).returns(true);

      process.stdout.write('hello');

      expect(handle.callsMatching([])).toStrictEqual([['hello']]);
    });
  });

  describe('argument-addressed staging', () => {
    it('VALID: {two calledWith descriptions} => each call answers by its own argument regardless of call order', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.calledWith(['alpha']).returns(true);
      handle.calledWith(['beta']).returns(false);

      // Called in the opposite order to the staging — order must not matter
      const betaResult = process.stdout.write('beta');
      const alphaResult = process.stdout.write('alpha');

      expect(betaResult).toBe(false);
      expect(alphaResult).toBe(true);
    });

    it('VALID: {two proxies spying the same global} => share the same staged descriptions', () => {
      jestRegisterSpyOnAdapterProxy();

      const firstHandle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });
      const secondHandle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      firstHandle.calledWith(['shared']).returns(true);

      const result = process.stdout.write('shared');

      expect(result).toBe(true);
      expect(secondHandle.callsMatching([])).toStrictEqual([['shared']]);
    });

    it('VALID: {onceFor same args} => one-shot answers first, sticky answers after', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.calledWith(['line']).returns(true);
      handle.onceFor(['line']).returns(false);

      const result1 = process.stdout.write('line');
      const result2 = process.stdout.write('line');

      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });
  });

  describe('callsMatching', () => {
    it('VALID: {writes with two different args} => returns only the calls for the requested argument', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.calledWith([]).returns(true);

      process.stdout.write('alpha');
      process.stdout.write('beta');
      process.stdout.write('alpha');

      expect(handle.callsMatching(['alpha'])).toStrictEqual([['alpha'], ['alpha']]);
    });

    it('EMPTY: {argument never written} => returns no calls', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.calledWith([]).returns(true);

      process.stdout.write('beta');

      expect(handle.callsMatching(['alpha'])).toStrictEqual([]);
    });
  });

  describe('unmatched call without passthrough', () => {
    it('ERROR: {staging present, call matches nothing} => throws naming the call and what was described', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.calledWith(['alpha']).returns(true);

      expect(() => process.stdout.write('gamma')).toThrow(
        /^registerMock: nothing set up for the call/u,
      );
      expect(() => process.stdout.write('gamma')).toThrow(/"gamma"/u);
      expect(() => process.stdout.write('gamma')).toThrow(/Calls that ARE set up: \("alpha"\)/u);
    });

    it('ERROR: {nothing staged at all} => throws unconditionally', () => {
      jestRegisterSpyOnAdapterProxy();

      jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      expect(() => process.stdout.write('anything')).toThrow(
        /^registerMock: nothing set up for the call/u,
      );
    });
  });

  describe('unmatched call with passthrough', () => {
    it('VALID: {passthrough: true, staging present, call matches nothing} => falls through to the real implementation without throwing', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({
        object: process.stdout,
        method: 'write',
        passthrough: true,
      });

      handle.calledWith(['alpha']).returns(false);

      const result = process.stdout.write('unstaged-call');

      expect(result).toBe(true);
    });

    it('VALID: {passthrough: true, nothing staged at all} => never throws', () => {
      jestRegisterSpyOnAdapterProxy();

      jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write', passthrough: true });

      const result = process.stdout.write('anything');

      expect(result).toBe(true);
    });
  });

  describe('passthrough on a prototype method', () => {
    it('VALID: {object: Date.prototype, method: toISOString, passthrough: true} => real implementation runs with the call-time instance as receiver', () => {
      jestRegisterSpyOnAdapterProxy();

      jestRegisterSpyOnAdapter({
        object: Date.prototype,
        method: 'toISOString',
        passthrough: true,
      });

      const result = new Date(0).toISOString();

      expect(result).toBe('1970-01-01T00:00:00.000Z');
    });
  });
});
