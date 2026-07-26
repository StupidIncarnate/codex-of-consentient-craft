import { jestRegisterMockAdapter } from './jest-register-mock-adapter';
import { jestRegisterMockAdapterProxy } from './jest-register-mock-adapter.proxy';

describe('jestRegisterMockAdapter', () => {
  describe('argument-addressed staging', () => {
    it('VALID: {two paths staged} => each call gets the contents for the path it asked for', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith(['/a/quest.json']).resolves('quest-json');
      handle.calledWith(['/a/manifest.json']).resolves('manifest-json');

      // Called in the opposite order to the staging — order must not matter
      const manifest = await mockFn('/a/manifest.json');
      const quest = await mockFn('/a/quest.json');

      expect(manifest).toBe('manifest-json');
      expect(quest).toBe('quest-json');
    });

    it('VALID: {staged one arg, called with encoding} => prefix match still answers', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith(['/a/quest.json']).resolves('quest-json');

      await expect(mockFn('/a/quest.json', 'utf-8')).resolves.toBe('quest-json');
    });

    it('VALID: {staging answers repeatedly} => sticky across calls', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith(['/a/quest.json']).resolves('quest-json');

      await expect(mockFn('/a/quest.json')).resolves.toBe('quest-json');
      await expect(mockFn('/a/quest.json')).resolves.toBe('quest-json');
    });

    it('VALID: {object subset staged} => matches a call passing extra keys', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith([{ nodir: true }]).returns('matched-subset');

      expect(mockFn({ nodir: true, cwd: '/x' })).toBe('matched-subset');
    });

    it('VALID: {predicate matcher} => matches by evaluating the function against the actual argument', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith([(value: unknown) => String(value).endsWith('.json')]).returns('matched');

      expect(mockFn('/a/manifest.json')).toBe('matched');
    });

    it('VALID: {RegExp matcher} => matches a string argument against the pattern', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith([/\.json$/u]).returns('matched-by-pattern');

      expect(mockFn('/a/quest.json')).toBe('matched-by-pattern');
    });

    it('VALID: {Date matcher} => matches by time value', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith([new Date('2026-01-01T00:00:00.000Z')]).returns('matched-by-time');

      expect(mockFn(new Date('2026-01-01T00:00:00.000Z'))).toBe('matched-by-time');
    });

    it('VALID: {options matcher and pattern-only matcher} => most specific staging wins', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith(['src/**']).resolves([]);
      handle.calledWith(['src/**', { nodir: true }]).resolves(['src/a.ts']);

      await expect(mockFn('src/**', { nodir: true, cwd: '/x' })).resolves.toStrictEqual([
        'src/a.ts',
      ]);
      await expect(mockFn('src/**', { cwd: '/x' })).resolves.toStrictEqual([]);
    });

    it('VALID: {onceFor same args} => one-shot answers first, sticky answers after', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith(['/a/quest.json']).resolves('after');
      handle.onceFor(['/a/quest.json']).resolves('first');

      await expect(mockFn('/a/quest.json')).resolves.toBe('first');
      await expect(mockFn('/a/quest.json')).resolves.toBe('after');
    });

    it('VALID: {rejects staging} => the matching call rejects', async () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      const error = new Error('ENOENT');

      handle.calledWith(['/a/missing.json']).rejects(error);

      await expect(mockFn('/a/missing.json')).rejects.toBe(error);
    });
  });

  describe('throw on unmatched', () => {
    it('ERROR: {call matches no staging} => throws naming both the actual call and what is staged', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith(['/a/quest.json']).resolves('quest-json');

      expect(() => mockFn('/a/other.json')).toThrow(/^registerMock: nothing set up for the call/u);
      expect(() => mockFn('/a/other.json')).toThrow(/"\/a\/other\.json"/u);
      expect(() => mockFn('/a/other.json')).toThrow(
        /Calls that ARE set up: \("\/a\/quest\.json"\)/u,
      );
    });

    it('ERROR: {nothing staged at all} => throws unconditionally', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();

      jestRegisterMockAdapter({ fn: mockFn });

      expect(() => mockFn('/a/anything.json')).toThrow(
        /^registerMock: nothing set up for the call/u,
      );
    });
  });

  describe('callsMatching', () => {
    it('VALID: {writes to two paths} => returns only the calls for the requested path', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith([]).returns(undefined);

      mockFn('/out/manifest.json', 'manifest-body');
      mockFn('/out/bundle.js', 'compiled-blob');

      expect(handle.callsMatching(['/out/manifest.json'])).toStrictEqual([
        ['/out/manifest.json', 'manifest-body'],
      ]);
    });

    it('EMPTY: {path never called} => returns no calls', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle = jestRegisterMockAdapter({ fn: mockFn });

      handle.calledWith([]).returns(undefined);

      mockFn('/out/bundle.js', 'compiled-blob');

      expect(handle.callsMatching(['/out/manifest.json'])).toStrictEqual([]);
    });
  });

  describe('dispatcher re-installation', () => {
    it('VALID: {re-register after reset} => dispatcher reinstalls and answers from fresh staging', () => {
      jestRegisterMockAdapterProxy();

      const mockFn = jest.fn();
      const handle1 = jestRegisterMockAdapter({ fn: mockFn });

      handle1.calledWith([]).returns('first-gen');

      expect(mockFn()).toBe('first-gen');

      // Simulate resetAllMocks
      mockFn.mockReset();

      const handle2 = jestRegisterMockAdapter({ fn: mockFn });

      handle2.calledWith([]).returns('second-gen');

      expect(mockFn()).toBe('second-gen');
    });
  });
});
