import ourModule, { gzipSync, gunzipSync, constants } from './zlib';
import pkgModule from 'zlib';

describe('#gateway/node/zlib', () => {
  it('VALID: {module} => re-exports the same runtime binding as zlib', () => {
    expect(ourModule).toBe(pkgModule);
  });

  it('VALID: {gzipSync, gunzipSync, constants} => each is the same binding as the built-in member', () => {
    expect([gzipSync, gunzipSync, constants]).toStrictEqual([
      pkgModule.gzipSync,
      pkgModule.gunzipSync,
      pkgModule.constants,
    ]);
  });
});
