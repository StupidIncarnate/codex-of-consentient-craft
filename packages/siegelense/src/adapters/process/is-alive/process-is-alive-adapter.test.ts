import { runInNewContext } from 'vm';

import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { ProcessGroupIdStub } from '../../../contracts/process-group-id/process-group-id.stub';
import { processIsAliveAdapter } from './process-is-alive-adapter';
import { processIsAliveAdapterProxy } from './process-is-alive-adapter.proxy';

describe('processIsAliveAdapter', () => {
  // Regression guard: `kill` here and `@dungeonmaster/shared`'s processCwdAdapter both wrap
  // `process`. Jest's mock registry resolves the bare specifier and the `node:`-prefixed one to
  // the SAME module, so two proxies mocking it under different specifier strings must merge into
  // one factory or the losing proxy's calls fall through to the real syscall with no error.
  // `mockCallsMergeByModuleTransformer` (in `@dungeonmaster/testing`) is what keeps this
  // composition safe, whichever specifier either adapter imports from.
  describe('composed with a cross-package proxy that also mocks process', () => {
    it('VALID: {cwd proxy registered before isAlive proxy} => isAlive mock still intercepts kill', () => {
      const cwdProxy = processCwdAdapterProxy();
      cwdProxy.returns({ path: '/tmp/repro' });
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 999_999 });
      proxy.setupAlive({ pgid });

      const result = processIsAliveAdapter({ pgid });

      expect(result).toBe(true);
    });
  });

  describe('a live group', () => {
    it('VALID: {alive group} => returns true', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupAlive({ pgid });

      const result = processIsAliveAdapter({ pgid });

      expect(result).toBe(true);
    });

    it('VALID: {pgid: 4821} => probes the NEGATED pgid with signal 0, not a real signal', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      proxy.setupAlive({ pgid });

      processIsAliveAdapter({ pgid });

      expect(proxy.getCallFor({ pgid })).toStrictEqual([-4821, 0]);
    });
  });

  describe('a group that already exited', () => {
    it('ERROR: {ESRCH} => isAlive returns false', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 99_999 });
      proxy.setupGone({ pgid });

      const result = processIsAliveAdapter({ pgid });

      expect(result).toBe(false);
    });
  });

  describe('a real failure', () => {
    it('ERROR: {EPERM} => rethrows rather than reporting false', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      const error = new Error('kill EPERM') as NodeJS.ErrnoException;
      error.code = 'EPERM';
      proxy.setupUnknownError({ pgid, error });

      expect(() => processIsAliveAdapter({ pgid })).toThrow('kill EPERM');
    });
  });

  // Realm-safety, proven the way error-is-native-error-adapter.test.ts proves it:
  // `vm.runInNewContext` builds this ESRCH the same way Node's own `process.kill` internals do —
  // with a DIFFERENT realm's Error constructor — so `crossRealmEsrch instanceof Error` reads
  // false even though it genuinely is one. A pre-fix `error instanceof Error` check would take
  // this branch's `throw error` path instead of reporting the exited group as `false`.
  describe('ESRCH built in a different vm realm', () => {
    it('EDGE: {ESRCH from a cross-realm Error} => returns false without throwing', () => {
      const proxy = processIsAliveAdapterProxy();
      const pgid = ProcessGroupIdStub({ value: 4821 });
      const crossRealmEsrch: unknown = runInNewContext(
        'const e = new Error("kill ESRCH"); e.code = "ESRCH"; e;',
      );

      expect(crossRealmEsrch instanceof Error).toBe(false);

      proxy.setupUnknownError({ pgid, error: crossRealmEsrch });

      const result = processIsAliveAdapter({ pgid });

      expect(result).toBe(false);
    });
  });
});
