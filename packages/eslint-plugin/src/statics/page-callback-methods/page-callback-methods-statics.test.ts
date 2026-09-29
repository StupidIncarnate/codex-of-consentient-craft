import { pageCallbackMethodsStatics } from './page-callback-methods-statics';

describe('pageCallbackMethodsStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(pageCallbackMethodsStatics).toStrictEqual({
      names: ['evaluate', 'evaluateAll', 'waitForFunction', 'addInitScript'],
    });
  });
});
