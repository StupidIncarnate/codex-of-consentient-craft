import { compileFunction } from 'vm';

import { jestRegisterMockAdapter } from './jest-register-mock-adapter';
import { jestRegisterMockAdapterProxy } from './jest-register-mock-adapter.proxy';

describe('jestRegisterMockAdapter', () => {
  describe('single registration', () => {
    it('VALID: {fn: jest.fn()} => mockImplementation routes calls through handle', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockImplementation((() => 'handled') as never);

      const result = mockFn();

      expect(result).toBe('handled');
      expect(handle.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {fn: jest.fn()} => mockReturnValue returns the value', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockReturnValue(42);

      const result = mockFn();

      expect(result).toBe(42);
      expect(handle.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {fn: jest.fn()} => mockResolvedValue returns resolved promise', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockResolvedValue('async-result');

      const result = await mockFn();

      expect(result).toBe('async-result');
      expect(handle.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {fn: jest.fn()} => mockRejectedValueOnce rejects once', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });
      const error = new Error('test-error');

      handle.mockRejectedValueOnce(error);
      handle.mockReturnValue('fallback');

      await expect(mockFn()).rejects.toBe(error);

      const fallbackResult = mockFn();

      expect(fallbackResult).toBe('fallback');
    });
  });

  describe('once queue', () => {
    it('VALID: {mockImplementationOnce called twice} => consumes in order then falls through', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockImplementationOnce((() => 'first') as never);
      handle.mockImplementationOnce((() => 'second') as never);
      handle.mockImplementation((() => 'base') as never);

      const result1 = mockFn();
      const result2 = mockFn();
      const result3 = mockFn();

      expect(result1).toBe('first');
      expect(result2).toBe('second');
      expect(result3).toBe('base');
    });

    it('VALID: {mockReturnValueOnce} => returns value once then falls to base', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockReturnValueOnce('once-value');
      handle.mockReturnValue('base-value');

      const result1 = mockFn();
      const result2 = mockFn();

      expect(result1).toBe('once-value');
      expect(result2).toBe('base-value');
    });

    it('VALID: {mockResolvedValueOnce} => resolves once then falls to base', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockResolvedValueOnce('once-async');
      handle.mockResolvedValue('base-async');

      const result1 = await mockFn();
      const result2 = await mockFn();

      expect(result1).toBe('once-async');
      expect(result2).toBe('base-async');
    });
  });

  describe('call tracking', () => {
    it('VALID: {multiple calls with args} => handle.mock.calls tracks all arguments', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockImplementation((() => undefined) as never);

      mockFn('a', 'b');
      mockFn('c');
      mockFn();

      expect(handle.mock.calls).toStrictEqual([['a', 'b'], ['c'], []]);
    });
  });

  describe('mockClear', () => {
    it('VALID: {after calls and implementations} => resets calls, queue, and baseImpl', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockReturnValue('value');
      handle.mockReturnValueOnce('once');
      mockFn();

      handle.mockClear();

      expect(handle.mock.calls).toStrictEqual([]);

      const result = mockFn();

      expect(result).toBe(undefined);
    });
  });

  describe('passthrough to real impl', () => {
    it('VALID: {fn with existing impl, no callerPath match} => falls through to real', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn().mockImplementation((() => 'real-impl') as never);

      // Register from a vm-compiled function so callerPath = 'nonexistent-adapter'
      const registerFromNonexistent = compileFunction(
        'return registerMock({ fn })',
        ['registerMock', 'fn'],
        { filename: '/fake/nonexistent-adapter.js' },
      ) as (
        registerMock: typeof jestRegisterMockAdapter,
        fn: jest.Mock,
      ) => ReturnType<typeof jestRegisterMockAdapter>;

      const handle = registerFromNonexistent(jestRegisterMockAdapter, mockFn);

      handle.mockReturnValue('from-handle');

      // Invoke from the test file — 'jest-register-mock-adapter.test' does not match
      // 'nonexistent-adapter', so dispatcher falls through to real impl
      const result = mockFn();

      expect(result).toBe('real-impl');
    });
  });

  describe('dispatcher re-installation', () => {
    it('VALID: {re-register after reset} => dispatcher reinstalls and works', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();

      const handle1 = jestRegisterMockAdapter({ fn: mockFn });

      handle1.mockReturnValue('first-gen');

      expect(mockFn()).toBe('first-gen');

      // Simulate resetAllMocks
      mockFn.mockReset();

      // Re-register
      const handle2 = jestRegisterMockAdapter({ fn: mockFn });

      handle2.mockReturnValue('second-gen');

      expect(mockFn()).toBe('second-gen');
    });
  });

  describe('catch-all handle', () => {
    it('VALID: {no callerPath match and catch-all registered} => catches unmatched calls', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockReturnValue('catch-all-result');

      const result = mockFn();

      expect(result).toBe('catch-all-result');
      expect(handle.mock.calls).toStrictEqual([[]]);
    });
  });

  describe('no impl set', () => {
    it('VALID: {handle with no impl} => returns undefined', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();

      jestRegisterMockAdapter({ fn: mockFn });

      const result = mockFn();

      expect(result).toBe(undefined);
    });
  });

  describe('multi-proxy dispatch', () => {
    it('VALID: {two registrations from different files on same fn} => routes calls to correct handle', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();

      // Create registration functions with distinct filenames via vm.compileFunction
      // These produce stack frames with the specified filename
      const registerFromAlpha = compileFunction(
        'return registerMock({ fn })',
        ['registerMock', 'fn'],
        { filename: '/fake/alpha-caller-adapter.js' },
      ) as (
        registerMock: typeof jestRegisterMockAdapter,
        fn: jest.Mock,
      ) => ReturnType<typeof jestRegisterMockAdapter>;

      const registerFromBeta = compileFunction(
        'return registerMock({ fn })',
        ['registerMock', 'fn'],
        { filename: '/fake/beta-caller-adapter.js' },
      ) as (
        registerMock: typeof jestRegisterMockAdapter,
        fn: jest.Mock,
      ) => ReturnType<typeof jestRegisterMockAdapter>;

      // Register from alpha context — callerPath derived as 'alpha-caller-adapter'
      const alphaHandle = registerFromAlpha(jestRegisterMockAdapter, mockFn);
      // Register from beta context — callerPath derived as 'beta-caller-adapter'
      const betaHandle = registerFromBeta(jestRegisterMockAdapter, mockFn);

      alphaHandle.mockReturnValue('from-alpha');
      betaHandle.mockReturnValue('from-beta');

      // Invoke from alpha context — dispatcher matches 'alpha-caller-adapter' in stack
      const invokeFromAlpha = compileFunction('return fn()', ['fn'], {
        filename: '/fake/alpha-caller-adapter.js',
      }) as (fn: jest.Mock) => unknown;

      // Invoke from beta context — dispatcher matches 'beta-caller-adapter' in stack
      const invokeFromBeta = compileFunction('return fn()', ['fn'], {
        filename: '/fake/beta-caller-adapter.js',
      }) as (fn: jest.Mock) => unknown;

      const alphaResult = invokeFromAlpha(mockFn);
      const betaResult = invokeFromBeta(mockFn);

      expect(alphaResult).toBe('from-alpha');
      expect(betaResult).toBe('from-beta');
      expect(alphaHandle.mock.calls).toStrictEqual([[]]);
      expect(betaHandle.mock.calls).toStrictEqual([[]]);
    });
  });

  describe('fresh proxies per it block', () => {
    it('VALID: {first it block} => gets independent handle', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockReturnValue('first-it');

      expect(mockFn()).toBe('first-it');
      expect(handle.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {second it block} => gets fresh independent handle with no bleed from first', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.mockReturnValue('second-it');

      expect(mockFn()).toBe('second-it');
      expect(handle.mock.calls).toStrictEqual([[]]);
    });
  });
});
