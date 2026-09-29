import { ruleBanProxyCatchAllDefaultsBroker } from './rule-ban-proxy-catch-all-defaults-broker';
import { ruleTesterHarness } from '../../../../test/harnesses/rule-tester/rule-tester.harness';

const ruleTester = ruleTesterHarness();

ruleTester.run('ban-proxy-catch-all-defaults', ruleBanProxyCatchAllDefaultsBroker(), {
  valid: [
    // A zero-arg function's only honest address is an empty array — no element to inspect
    {
      code: `export const randomUuidAdapterProxy = () => {
  const mock = registerMock({ fn: randomUUID });
  mock.calledWith([]).returns('11111111-1111-1111-1111-111111111111');
  return {};
};`,
      filename: '/project/src/adapters/crypto/random-uuid/random-uuid-adapter.proxy.ts',
    },
    // Addressed by a real argument, not a wildcard predicate
    {
      code: `export const fsReadFileAdapterProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  return {
    returns: ({ filePath, content }) => mock.calledWith([filePath]).returns(content),
  };
};`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
    },
    // The wildcard literal sits inside a RETURNED opt-in scenario method, not the constructor
    {
      code: `export const fsExistsAdapterProxy = () => {
  const mock = registerMock({ fn: existsSync });
  return {
    setupAlwaysTrue: () => mock.calledWith([() => true]).returns(true),
  };
};`,
      filename: '/project/src/adapters/fs/exists/fs-exists-adapter.proxy.ts',
    },
    // Non-proxy files are outside this rule's scope regardless of the address shape
    {
      code: `export const fsReadFileAdapter = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([() => true]).returns('');
  return {};
};`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    },
    // A spy addressed by a real argument, not a wildcard predicate
    {
      code: `export const stderrWriteAdapterProxy = () => {
  const spy = registerSpyOn({ object: process.stderr, method: 'write' });
  return {
    captures: ({ text }) => spy.calledWith([text]).returns(true),
  };
};`,
      filename: '/project/src/adapters/process/stderr-write/stderr-write-adapter.proxy.ts',
    },
    // A spy's wildcard literal sits inside a RETURNED opt-in scenario method
    {
      code: `export const stderrWriteAdapterProxy = () => {
  const spy = registerSpyOn({ object: process.stderr, method: 'write' });
  return {
    setupAlwaysTrue: () => spy.calledWith([() => true]).returns(true),
  };
};`,
      filename: '/project/src/adapters/process/stderr-write/stderr-write-adapter.proxy.ts',
    },
  ],
  invalid: [
    // A registerSpyOn handle staged with an accept-all predicate in the constructor
    {
      code: `export const stderrWriteAdapterProxy = () => {
  const spy = registerSpyOn({ object: process.stderr, method: 'write' });
  spy.calledWith([() => true]).returns(true);
  return {};
};`,
      filename: '/project/src/adapters/process/stderr-write/stderr-write-adapter.proxy.ts',
      errors: [{ messageId: 'catchAllProxyDefault' }],
    },
    // The same wildcard chained directly off registerSpyOn
    {
      code: `export const stderrWriteAdapterProxy = () => {
  registerSpyOn({ object: process.stderr, method: 'write' }).calledWith([() => true]).returns(true);
  return {};
};`,
      filename: '/project/src/adapters/process/stderr-write/stderr-write-adapter.proxy.ts',
      errors: [{ messageId: 'catchAllProxyDefault' }],
    },
    // Implicit-return arrow catch-all, staged in the constructor
    {
      code: `export const fsReadFileAdapterProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([() => true]).returns('');
  return {};
};`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
      errors: [{ messageId: 'catchAllProxyDefault' }],
    },
    // Function-expression block-body catch-all: one unconditional `return true;`
    {
      code: `export const fsReadFileAdapterProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  mock.calledWith([function () { return true; }]).returns('');
  return {};
};`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
      errors: [{ messageId: 'catchAllProxyDefault' }],
    },
    // The wildcard is only one of several address elements
    {
      code: `export const fsReadFileAdapterProxy = () => {
  const mock = registerMock({ fn: readFileSync });
  const isPath = (candidate) => candidate.endsWith('.json');
  mock.calledWith([() => true, isPath]).returns('');
  return {};
};`,
      filename: '/project/src/adapters/fs/read-file/fs-read-file-adapter.proxy.ts',
      errors: [{ messageId: 'catchAllProxyDefault' }],
    },
  ],
});
