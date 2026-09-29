import ourModule, { Readable, Writable, pipeline } from './stream';
import pkgModule from 'stream';

describe('#gateway/node/stream', () => {
  it('VALID: {module} => re-exports the same runtime binding as stream', () => {
    expect(ourModule).toBe(pkgModule);
  });

  it('VALID: {Readable, Writable, pipeline} => each is the same binding as the built-in member', () => {
    expect([Readable, Writable, pipeline]).toStrictEqual([
      pkgModule.Readable,
      pkgModule.Writable,
      pkgModule.pipeline,
    ]);
  });
});
