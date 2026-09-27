import { ParsedPathStub } from './parsed-path.stub';

describe('ParsedPathStub', () => {
  it('VALID: {} => parses the default sample path into its real segments', () => {
    const parsed = ParsedPathStub();

    // Node's own 'path' module parses outside the vm context Jest runs this file inside, so the
    // returned object's own prototype differs from a plain literal's — rebuilding it from its
    // (primitive, so realm-safe) fields is what makes a structural comparison possible.
    expect({
      root: parsed.root,
      dir: parsed.dir,
      base: parsed.base,
      ext: parsed.ext,
      name: parsed.name,
    }).toStrictEqual({
      root: '/',
      dir: '/repo/packages/@gateway/node/src/path',
      base: 'path.ts',
      ext: '.ts',
      name: 'path',
    });
  });

  it('VALID: {path} => parses the given path', () => {
    const parsed = ParsedPathStub({ path: '/tmp/notes.txt' });

    expect({
      root: parsed.root,
      dir: parsed.dir,
      base: parsed.base,
      ext: parsed.ext,
      name: parsed.name,
    }).toStrictEqual({
      root: '/',
      dir: '/tmp',
      base: 'notes.txt',
      ext: '.txt',
      name: 'notes',
    });
  });
});
