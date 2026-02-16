import { wardResultContract } from './ward-result-contract';
import { WardResultStub } from './ward-result.stub';

describe('wardResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {empty run with no checks} => parses successfully', () => {
      const result = wardResultContract.parse(WardResultStub());

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        filters: {},
        checks: [],
      });
    });

    it('VALID: {run with checks and filters} => parses successfully', () => {
      const result = wardResultContract.parse(
        WardResultStub({
          filters: { only: ['lint'], changed: true },
          checks: [
            {
              checkType: 'lint',
              status: 'pass',
              projectResults: [],
            },
          ],
        }),
      );

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        filters: { only: ['lint'], changed: true },
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [],
          },
        ],
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_RUN_ID: {runId: "bad"} => throws validation error', () => {
      expect(() =>
        wardResultContract.parse({
          runId: 'bad',
          timestamp: 0,
          filters: {},
          checks: [],
        }),
      ).toThrow(/Invalid RunId format/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => wardResultContract.parse({})).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid ward result', () => {
      const result = WardResultStub();

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        filters: {},
        checks: [],
      });
    });

    it('VALID: {custom timestamp} => creates ward result with override', () => {
      const result = WardResultStub({ timestamp: 9999999999999 });

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 9999999999999,
        filters: {},
        checks: [],
      });
    });
  });
});
