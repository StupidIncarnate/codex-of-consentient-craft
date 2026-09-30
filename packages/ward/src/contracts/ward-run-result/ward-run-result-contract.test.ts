import { wardRunResultContract } from './ward-run-result-contract';
import { WardRunResultStub } from './ward-run-result.stub';

describe('wardRunResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {empty run with no checks} => parses successfully', () => {
      const result = wardRunResultContract.parse(WardRunResultStub());

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        filters: {},
        checks: [],
        durationMs: 0,
      });
    });

    it('VALID: {run with checks and filters} => parses successfully', () => {
      const result = wardRunResultContract.parse(
        WardRunResultStub({
          filters: { only: ['lint'], committed: true },
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
        filters: { only: ['lint'], committed: true },
        checks: [
          {
            checkType: 'lint',
            status: 'pass',
            projectResults: [],
            durationMs: 0,
          },
        ],
        durationMs: 0,
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {runId: "bad"} => throws validation error', () => {
      expect(() =>
        wardRunResultContract.parse({
          runId: 'bad',
          timestamp: 0,
          filters: {},
          checks: [],
        }),
      ).toThrow(/Invalid RunId format/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => wardRunResultContract.parse({})).toThrow(/received undefined/u);
    });
  });

  describe('durationMs defaults', () => {
    it('VALID: {durationMs omitted} => defaults to 0', () => {
      const result = wardRunResultContract.parse({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        filters: {},
        checks: [],
      });

      expect(result.durationMs).toBe(0);
    });

    it('VALID: {durationMs provided} => preserves value', () => {
      const result = wardRunResultContract.parse(WardRunResultStub({ durationMs: 23400 }));

      expect(result.durationMs).toBe(23400);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid ward result', () => {
      const result = WardRunResultStub();

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 1739625600000,
        filters: {},
        checks: [],
        durationMs: 0,
      });
    });

    it('VALID: {custom timestamp} => creates ward result with override', () => {
      const result = WardRunResultStub({ timestamp: 9999999999999 });

      expect(result).toStrictEqual({
        runId: '1739625600000-a3f1',
        timestamp: 9999999999999,
        filters: {},
        checks: [],
        durationMs: 0,
      });
    });
  });
});
