import { PlaywrightSuiteStub } from './playwright-suite.stub';
import { playwrightSuiteContract } from './playwright-suite-contract';
import { PlaywrightSpecStub } from '../playwright-spec/playwright-spec.stub';
import { PlaywrightTestResultStub } from '../playwright-test-result/playwright-test-result.stub';

describe('playwrightSuiteContract', () => {
  describe('valid input', () => {
    it('VALID: {title with specs} => parses successfully', () => {
      const result = playwrightSuiteContract.parse({
        title: 'login',
        specs: [
          {
            title: 'should login',
            tests: [{ results: [{ status: 'failed', error: { message: 'Timeout' } }] }],
          },
        ],
      });

      expect(result).toStrictEqual(
        PlaywrightSuiteStub({
          title: 'login',
          specs: [
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
          ],
        }),
      );
    });

    it('VALID: {title only} => parses successfully without specs or suites', () => {
      const result = playwrightSuiteContract.parse({ title: 'empty' });

      expect(result).toStrictEqual(PlaywrightSuiteStub({ title: 'empty' }));
    });

    it('VALID: {title with empty specs} => parses successfully', () => {
      const result = playwrightSuiteContract.parse({ title: 'empty', specs: [] });

      expect(result).toStrictEqual(PlaywrightSuiteStub({ title: 'empty', specs: [] }));
    });
  });

  describe('invalid input', () => {
    it('INVALID_TITLE: {missing title} => throws validation error', () => {
      expect(() => playwrightSuiteContract.parse({ specs: [] })).toThrow(/required/iu);
    });
  });
});
