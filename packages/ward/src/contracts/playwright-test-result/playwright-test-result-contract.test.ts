import { PlaywrightTestResultStub } from './playwright-test-result.stub';
import { playwrightTestResultContract } from './playwright-test-result-contract';

describe('playwrightTestResultContract', () => {
  describe('valid input', () => {
    it('VALID: {status failed with error and stack} => parses successfully', () => {
      const result = playwrightTestResultContract.parse({
        status: 'failed',
        error: { message: 'Expected visible', stack: 'Error: Expected visible\n    at line:5' },
      });

      expect(result).toStrictEqual(
        PlaywrightTestResultStub({
          status: 'failed',
          error: { message: 'Expected visible', stack: 'Error: Expected visible\n    at line:5' },
        }),
      );
    });

    it('VALID: {status passed without error} => parses successfully', () => {
      const result = playwrightTestResultContract.parse({ status: 'passed' });

      expect(result).toStrictEqual(PlaywrightTestResultStub({ status: 'passed' }));
    });

    it('VALID: {error without stack} => parses successfully', () => {
      const result = playwrightTestResultContract.parse({
        status: 'failed',
        error: { message: 'Timeout' },
      });

      expect(result).toStrictEqual(
        PlaywrightTestResultStub({ status: 'failed', error: { message: 'Timeout' } }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID_STATUS: {missing status} => throws validation error', () => {
      expect(() => playwrightTestResultContract.parse({})).toThrow(/required/iu);
    });
  });
});
