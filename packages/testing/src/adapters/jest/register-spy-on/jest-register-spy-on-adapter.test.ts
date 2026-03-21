import { jestRegisterSpyOnAdapter } from './jest-register-spy-on-adapter';
import { jestRegisterSpyOnAdapterProxy } from './jest-register-spy-on-adapter.proxy';

describe('jestRegisterSpyOnAdapter', () => {
  describe('basic spy', () => {
    it('VALID: {object: process.stdout, method: write} => intercepts calls and tracks them', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.mockReturnValue(true);

      process.stdout.write('hello');

      expect(handle.mock.calls).toStrictEqual([['hello']]);
    });
  });

  describe('mockImplementation', () => {
    it('VALID: {mockImplementation set} => routes calls through custom implementation', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.mockImplementation((() => true) as never);

      const result = process.stdout.write('test');

      expect(result).toBe(true);
      expect(handle.mock.calls).toStrictEqual([['test']]);
    });
  });

  describe('mockReturnValue', () => {
    it('VALID: {mockReturnValue set} => returns the value on each call', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.mockReturnValue(true);

      process.stdout.write('a');
      process.stdout.write('b');

      expect(handle.mock.calls).toStrictEqual([['a'], ['b']]);
    });
  });

  describe('once queue', () => {
    it('VALID: {mockReturnValueOnce then mockReturnValue} => consumes once value first', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.mockReturnValueOnce(false);
      handle.mockReturnValue(true);

      const result1 = process.stdout.write('first');
      const result2 = process.stdout.write('second');

      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });
  });

  describe('mockClear', () => {
    it('VALID: {after calls} => resets calls and baseImpl', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.mockReturnValue(true);

      process.stdout.write('before-clear');

      handle.mockClear();

      process.stdout.write('after-clear');

      expect(handle.mock.calls).toStrictEqual([['after-clear']]);
    });
  });

  describe('mockImplementationOnce', () => {
    it('VALID: {two once impls then base} => consumes in order', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({ object: process.stdout, method: 'write' });

      handle.mockImplementationOnce((() => 'first') as never);
      handle.mockImplementationOnce((() => 'second') as never);
      handle.mockImplementation((() => 'base') as never);

      const result1 = process.stdout.write('a');
      const result2 = process.stdout.write('b');
      const result3 = process.stdout.write('c');

      expect(result1).toBe('first');
      expect(result2).toBe('second');
      expect(result3).toBe('base');
    });
  });

  describe('passthrough', () => {
    it('VALID: {passthrough: true} => calls real implementation and records calls', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({
        object: process.stdout,
        method: 'write',
        passthrough: true,
      });

      const result = process.stdout.write('passthrough-test');

      expect(result).toBe(true);
      expect(handle.mock.calls).toStrictEqual([['passthrough-test']]);
    });

    it('VALID: {passthrough: true, mockImplementation override} => uses override instead of real', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({
        object: process.stdout,
        method: 'write',
        passthrough: true,
      });

      handle.mockImplementation((() => false) as never);

      const result = process.stdout.write('overridden');

      expect(result).toBe(false);
      expect(handle.mock.calls).toStrictEqual([['overridden']]);
    });

    it('VALID: {passthrough: true, mockImplementationOnce} => uses once then falls back to real', () => {
      jestRegisterSpyOnAdapterProxy();

      const handle = jestRegisterSpyOnAdapter({
        object: process.stdout,
        method: 'write',
        passthrough: true,
      });

      handle.mockImplementationOnce((() => false) as never);

      const result1 = process.stdout.write('first-call');
      const result2 = process.stdout.write('second-call');

      expect(result1).toBe(false);
      expect(result2).toBe(true);
      expect(handle.mock.calls).toStrictEqual([['first-call'], ['second-call']]);
    });
  });
});
