import { ResponseStub } from './response.stub';

describe('ResponseStub', () => {
  it('EMPTY: {} => a 200 response with an empty body', async () => {
    const response = ResponseStub();

    expect({ status: response.status, text: await response.text() }).toStrictEqual({
      status: 200,
      text: '',
    });
  });

  it('VALID: {body, status, headers} => a response carrying all three', async () => {
    const response = ResponseStub({ body: 'nope', status: 404, headers: { 'x-id': 'a' } });

    expect({
      status: response.status,
      ok: response.ok,
      header: response.headers.get('x-id'),
      text: await response.text(),
    }).toStrictEqual({ status: 404, ok: false, header: 'a', text: 'nope' });
  });

  it('EDGE: {status: 204} => builds without a body, as a no-content status requires', () => {
    const response = ResponseStub({ status: 204 });

    expect(response.status).toBe(204);
  });
});
