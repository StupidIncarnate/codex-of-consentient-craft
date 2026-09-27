import { FetchResponseStub } from './fetch-response.stub';

describe('FetchResponseStub', () => {
  it('VALID: {} => a real, ok, 200 JSON Response with the default body', async () => {
    const response = FetchResponseStub();

    expect({
      isResponse: response instanceof Response,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
    }).toStrictEqual({
      isResponse: true,
      ok: true,
      status: 200,
      contentType: 'application/json',
    });
    await expect(response.json()).resolves.toStrictEqual({ ok: true });
  });

  it('VALID: {body, status: 404} => a real, not-ok Response carrying the given body and status', async () => {
    const response = FetchResponseStub({ body: { error: 'not found' }, status: 404 });

    expect({ ok: response.ok, status: response.status }).toStrictEqual({
      ok: false,
      status: 404,
    });
    await expect(response.json()).resolves.toStrictEqual({ error: 'not found' });
  });
});
