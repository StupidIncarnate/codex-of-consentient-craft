import { existsSync } from 'fs';
import { join } from 'path';
import { PackageRootPathStub } from './package-root-path.stub';

describe('PackageRootPathStub', () => {
  it("VALID: {} => resolves to a real directory holding zod's own package.json", () => {
    const root = PackageRootPathStub();

    expect(existsSync(join(root, 'package.json'))).toBe(true);
  });

  it('ERROR: {specifier: a package that cannot resolve} => throws naming the specifier', () => {
    expect(() =>
      PackageRootPathStub({ specifier: 'this-package-does-not-exist-anywhere' }),
    ).toThrow(/this-package-does-not-exist-anywhere/u);
  });
});
