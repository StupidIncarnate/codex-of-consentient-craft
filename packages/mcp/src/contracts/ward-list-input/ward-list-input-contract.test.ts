import { wardListInputContract as _wardListInputContract } from './ward-list-input-contract';
import { WardListInputStub } from './ward-list-input.stub';

describe('wardListInputContract', () => {
  it('VALID: {} => parses successfully with no runId', () => {
    const result = WardListInputStub();

    expect(result).toStrictEqual({});
  });

  it('VALID: {runId} => parses successfully with runId', () => {
    const result = WardListInputStub({ runId: '1739625600000-a3f1' });

    expect(result).toStrictEqual({
      runId: '1739625600000-a3f1',
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_RUN_ID: {runId: "bad-format"} => throws validation error', () => {
      expect(() => {
        _wardListInputContract.parse({ runId: 'bad-format' });
      }).toThrow(/Invalid RunId format/u);
    });
  });
});
