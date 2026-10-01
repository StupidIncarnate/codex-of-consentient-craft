import { responderResultContract } from './responder-result-contract';
import { ResponderResultStub } from './responder-result.stub';

describe('responderResultContract', () => {
  it('VALID: {status: 200, data: object} => parses successfully', () => {
    const result = ResponderResultStub({ status: 200, data: { success: true } });

    expect(responderResultContract.parse(result)).toStrictEqual({
      status: 200,
      data: { success: true },
    });
  });

  it('VALID: {status: 500, data: error object} => parses successfully', () => {
    const result = ResponderResultStub({ status: 500, data: { error: 'fail' } });

    expect(responderResultContract.parse(result)).toStrictEqual({
      status: 500,
      data: { error: 'fail' },
    });
  });

  it('INVALID: {missing status} => throws validation error', () => {
    expect(() => {
      responderResultContract.parse({ data: 'test' });
    }).toThrow(/received undefined/u);
  });

  it('INVALID: {data: {}} => throws validation error because empty object matches no union member', () => {
    expect(() => {
      responderResultContract.parse({ status: 200, data: {} });
    }).toThrow(/Invalid input/u);
  });
});
