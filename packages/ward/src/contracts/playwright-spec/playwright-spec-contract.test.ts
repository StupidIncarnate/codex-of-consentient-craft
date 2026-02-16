import { PlaywrightSpecStub } from './playwright-spec.stub';
import { playwrightSpecContract } from './playwright-spec-contract';
import { PlaywrightTestResultStub } from '../playwright-test-result/playwright-test-result.stub';

describe('playwrightSpecContract', () => {
  describe('valid input', () => {
    it('VALID: {title and tests with results} => parses successfully', () => {
      const result = playwrightSpecContract.parse({
        title: 'should login',
        tests: [{ results: [{ status: 'failed', error: { message: 'Timeout' } }] }],
      });

      expect(result).toStrictEqual(
        PlaywrightSpecStub({
          title: 'should login',
          tests: [
            {
              results: [
                PlaywrightTestResultStub({ status: 'failed', error: { message: 'Timeout' } }),
              ],
            },
          ],
        }),
      );
    });

    it('VALID: {empty tests array} => parses successfully', () => {
      const result = playwrightSpecContract.parse({
        title: 'empty spec',
        tests: [],
      });

      expect(result).toStrictEqual(PlaywrightSpecStub({ title: 'empty spec', tests: [] }));
    });
  });

  describe('invalid input', () => {
    it('INVALID_TITLE: {missing title} => throws validation error', () => {
      expect(() => playwrightSpecContract.parse({ tests: [] })).toThrow(/required/iu);
    });

    it('INVALID_TESTS: {missing tests} => throws validation error', () => {
      expect(() => playwrightSpecContract.parse({ title: 'test' })).toThrow(/required/iu);
    });
  });
});
