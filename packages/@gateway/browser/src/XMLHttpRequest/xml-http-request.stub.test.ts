import { XmlHttpRequestStub } from './xml-http-request.stub';

describe('XmlHttpRequestStub', () => {
  it('VALID: {} => a real, unsent XMLHttpRequest', () => {
    const request = XmlHttpRequestStub();

    expect({
      isXhr: request instanceof XMLHttpRequest,
      readyState: request.readyState,
    }).toStrictEqual({ isXhr: true, readyState: XMLHttpRequest.UNSENT });
  });

  it('VALID: {open() called} => the real instance transitions to OPENED', () => {
    const request = XmlHttpRequestStub();

    request.open('GET', 'https://example.com/api/guilds');

    expect(request.readyState).toBe(XMLHttpRequest.OPENED);
  });
});
