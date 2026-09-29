import { resultRowContract } from './result-row-contract';
import { ResultRowStub } from './result-row.stub';

describe('resultRowContract', () => {
  it('VALID: {a JSON object} => keeps every key and value', () => {
    const row = ResultRowStub({ url: 'http://localhost/api', method: 'GET' });

    const result = resultRowContract.parse(row);

    expect(result).toStrictEqual({ status: 200, url: 'http://localhost/api', method: 'GET' });
  });

  it('EDGE: {a JSON array} => reads as an empty object', () => {
    const result = resultRowContract.parse([1, 2, 3]);

    expect(result).toStrictEqual({});
  });

  it('EDGE: {a bare number} => reads as an empty object', () => {
    const result = resultRowContract.parse(42);

    expect(result).toStrictEqual({});
  });

  it('EDGE: {null} => reads as an empty object', () => {
    const result = resultRowContract.parse(null);

    expect(result).toStrictEqual({});
  });
});
