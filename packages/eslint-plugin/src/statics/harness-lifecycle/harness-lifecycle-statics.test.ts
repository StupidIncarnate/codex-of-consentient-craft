import { harnessLifecycleStatics } from './harness-lifecycle-statics';

describe('harnessLifecycleStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(harnessLifecycleStatics).toStrictEqual({
      allowedHooks: ['beforeEach', 'afterEach', 'beforeAll', 'afterAll'],
      allowedHookSet: new Set(['beforeEach', 'afterEach', 'beforeAll', 'afterAll']),
      allowedNodeBuiltins: ['fs', 'path', 'os'],
      allowedNodeBuiltinSet: new Set(['fs', 'path', 'os']),
    });
  });
});
