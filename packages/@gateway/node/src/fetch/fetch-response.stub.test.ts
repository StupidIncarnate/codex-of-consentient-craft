import { FetchResponseStub } from './fetch-response.stub';

describe('FetchResponseStub', () => {
  it('VALID: {} => defaults to a 200 JSON response of {ok: true}', async () => {
    const response = FetchResponseStub();
    // Node's own `Response.json()` parses through the un-sandboxed main realm, not the vm
    // context Jest runs this file inside — re-interning through this realm's own JSON is what
    // `#gateway/npm/msw/http-response/http-response.stub.test.ts` already does for the same reason.
    const parsedBody: unknown = JSON.parse(JSON.stringify(await response.json()));

    expect({ status: response.status, ok: response.ok, body: parsedBody }).toStrictEqual({
      status: 200,
      ok: true,
      body: { ok: true },
    });
  });

  it('VALID: {body, status} => carries the given body and status', async () => {
    const response = FetchResponseStub({ body: { id: 'g1' }, status: 404 });
    const parsedBody: unknown = JSON.parse(JSON.stringify(await response.json()));

    expect({ status: response.status, ok: response.ok, body: parsedBody }).toStrictEqual({
      status: 404,
      ok: false,
      body: { id: 'g1' },
    });
  });

  it('VALID: {} => carries the real content-type header fetch callers read', () => {
    const response = FetchResponseStub();

    expect(response.headers.get('content-type')).toBe('application/json');
  });
});
