import { responderResultContract } from './responder-result-contract';
import { ResponderResultStub } from './responder-result.stub';

describe('responderResultContract', () => {
  it('VALID: {status: 200, data: object} => parses successfully', () => {
    const result = ResponderResultStub({ status: 200, data: { id: 'abc' } });

    expect(responderResultContract.parse(result)).toStrictEqual({
      status: 200,
      data: { id: 'abc' },
    });
  });

  it('VALID: {status: 500, data: error object} => parses successfully', () => {
    const result = ResponderResultStub({ status: 500, data: { error: 'fail' } });

    expect(responderResultContract.parse(result)).toStrictEqual({
      status: 500,
      data: { error: 'fail' },
    });
  });

  it('INVALID_MULTIPLE: {missing status} => throws validation error', () => {
    expect(() => {
      responderResultContract.parse({ data: 'test' });
    }).toThrow(/Required/u);
  });
});
