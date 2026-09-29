import ourModule, { createServer, STATUS_CODES, request } from './http';
import pkgModule from 'http';

describe('#gateway/node/http', () => {
  it('VALID: {module} => re-exports the same runtime binding as http', () => {
    expect(ourModule).toBe(pkgModule);
  });

  it('VALID: {createServer, request, STATUS_CODES} => each is the same binding as the built-in member', () => {
    expect([createServer, request, STATUS_CODES]).toStrictEqual([
      pkgModule.createServer,
      pkgModule.request,
      pkgModule.STATUS_CODES,
    ]);
  });
});
