import { childProcessExitCodesStatics } from './child-process-exit-codes-statics';

describe('childProcessExitCodesStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(childProcessExitCodesStatics).toStrictEqual({
      SUCCESS: 0,
      ERROR: 1,
      ESLINT_CRASH: 2,
    });
  });
});
