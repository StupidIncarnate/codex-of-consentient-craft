import { Response } from './Response';

describe('#gateway/node/Response', () => {
  it('VALID: {export} => is the Response class Node provides', () => {
    expect(Response.name).toBe('Response');
  });

  it('VALID: {body, status} => a response carrying that body text and status', async () => {
    const response = new Response('hello', { status: 201 });

    expect({ status: response.status, ok: response.ok, text: await response.text() }).toStrictEqual(
      {
        status: 201,
        ok: true,
        text: 'hello',
      },
    );
  });
});
