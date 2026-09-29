import { HttpServerStub } from './http-server.stub';

describe('HttpServerStub', () => {
  it('VALID: {} => is a server that is not listening', () => {
    const server = HttpServerStub();

    expect(server.listening).toBe(false);
  });

  it('VALID: {} => each call returns a distinct server', () => {
    const first = HttpServerStub();
    const second = HttpServerStub();
    first.maxHeadersCount = 7;

    expect([first.maxHeadersCount, second.maxHeadersCount]).toStrictEqual([7, null]);
  });
});
