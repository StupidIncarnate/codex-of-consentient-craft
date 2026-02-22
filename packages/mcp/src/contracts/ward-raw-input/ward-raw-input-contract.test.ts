import { wardRawInputContract as _wardRawInputContract } from './ward-raw-input-contract';
import { WardRawInputStub } from './ward-raw-input.stub';

describe('wardRawInputContract', () => {
  it('VALID: {runId, checkType: lint} => parses successfully', () => {
    const result = WardRawInputStub({
      runId: '1739625600000-a3f1',
      checkType: 'lint',
    });

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      checkType: 'lint',
    });
  });

  it('VALID: {checkType: typecheck} => parses successfully', () => {
    const result = WardRawInputStub({ checkType: 'typecheck' });

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      checkType: 'typecheck',
    });
  });

  it('VALID: default stub values => parses successfully', () => {
    const result = WardRawInputStub();

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
      checkType: 'lint',
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_RUN_ID: {runId: "bad"} => throws validation error', () => {
      expect(() => {
        _wardRawInputContract.parse({
          runId: 'bad',
          checkType: 'lint',
        });
      }).toThrow(/Invalid RunId format/u);
    });

    it('INVALID_CHECK_TYPE: {checkType: "invalid"} => throws validation error', () => {
      expect(() => {
        _wardRawInputContract.parse({
          runId: '1739625600000-a3f1',
          checkType: 'invalid',
        });
      }).toThrow(/Invalid enum value/u);
    });

    it('MISSING_CHECK_TYPE: {checkType: missing} => throws validation error', () => {
      expect(() => {
        _wardRawInputContract.parse({
          runId: '1739625600000-a3f1',
        });
      }).toThrow(/Required/u);
    });
  });
});
