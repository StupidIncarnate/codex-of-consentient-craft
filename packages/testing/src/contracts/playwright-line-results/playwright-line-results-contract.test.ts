import { PlaywrightLineResultsStub } from './playwright-line-results.stub';
import { playwrightLineResultsContract } from './playwright-line-results-contract';

describe('playwrightLineResultsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {empty results} => parses successfully', () => {
      const result = PlaywrightLineResultsStub();

      expect(result).toStrictEqual(
        playwrightLineResultsContract.parse({
          passed: [],
          failed: [],
          total: 0,
        }),
      );
    });

    it('VALID: {passed and failed entries} => parses successfully', () => {
      const result = PlaywrightLineResultsStub({
        passed: ['chat-smoke.spec.ts:25 > Chat Smoke > sends message'],
        failed: ['quest-approve.spec.ts:70 > Quest Approve > clicks button'],
        total: 2,
      });

      expect(result).toStrictEqual(
        playwrightLineResultsContract.parse({
          passed: ['chat-smoke.spec.ts:25 > Chat Smoke > sends message'],
          failed: ['quest-approve.spec.ts:70 > Quest Approve > clicks button'],
          total: 2,
        }),
      );
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {passed: [empty string]} => throws validation error', () => {
      expect(() =>
        playwrightLineResultsContract.parse({
          passed: [''],
          failed: [],
          total: 1,
        }),
      ).toThrow(/too_small/u);
    });

    it('INVALID: {total: negative} => throws validation error', () => {
      expect(() =>
        playwrightLineResultsContract.parse({
          passed: [],
          failed: [],
          total: -1,
        }),
      ).toThrow(/too_small/u);
    });
  });
});
