import { HttpResponseStub } from './http-response.stub';

describe('HttpResponseStub', () => {
  it('VALID: {} => a real Response with the default JSON body and status', async () => {
    const response = HttpResponseStub();
    // msw's own internal JSON parsing hands back a body whose prototype is not this test file's
    // own `Object.prototype`, which fails `toStrictEqual`'s prototype check even though the
    // content is identical — round-tripping through this realm's own JSON.parse/stringify keeps
    // the assertion on real CONTENT, not on which realm produced the parsed object.
    const body = JSON.parse(JSON.stringify(await response.json()));

    expect({ status: response.status, body }).toStrictEqual({ status: 200, body: { ok: true } });
  });

  it('VALID: {body, status} => reflects the given body and status', async () => {
    const response = HttpResponseStub({ body: { error: 'nope' }, status: 404 });
    const body = JSON.parse(JSON.stringify(await response.json()));

    expect({ status: response.status, body }).toStrictEqual({
      status: 404,
      body: { error: 'nope' },
    });
  });
});
