import { wardExitCodeStatics } from './ward-exit-code-statics';

describe('wardExitCodeStatics', () => {
  describe('exit codes', () => {
    it('VALID: {wardExitCodeStatics} => exposes pass, failing, and crash codes', () => {
      expect(wardExitCodeStatics).toStrictEqual({
        exitCodes: {
          pass: 0,
          failing: 1,
          crash: 2,
        },
      });
    });
  });
});
