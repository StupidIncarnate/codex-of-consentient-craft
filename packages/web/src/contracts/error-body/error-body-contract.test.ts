import { errorBodyContract } from './error-body-contract';
import { ErrorBodyStub } from './error-body.stub';

describe('errorBodyContract', () => {
  describe('valid bodies', () => {
    it('VALID: {error: message} => parses successfully', () => {
      const body = ErrorBodyStub({ error: 'Quest is currently running' as never });

      const result = errorBodyContract.parse(body);

      expect(result).toStrictEqual({ error: 'Quest is currently running' });
    });
  });

  describe('invalid bodies', () => {
    it('INVALID: {missing error} => throws validation error', () => {
      expect(() => {
        errorBodyContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {error: empty string} => throws validation error', () => {
      expect(() => {
        errorBodyContract.parse({ error: '' });
      }).toThrow(/at least 1/u);
    });

    it('INVALID: {error: non-string} => throws validation error', () => {
      expect(() => {
        errorBodyContract.parse({ error: 42 });
      }).toThrow(/Expected string/u);
    });

    it('EMPTY: {null} => throws validation error', () => {
      expect(() => {
        errorBodyContract.parse(null);
      }).toThrow(/Expected object/u);
    });
  });
});
