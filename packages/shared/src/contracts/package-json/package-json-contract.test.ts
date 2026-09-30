import { packageJsonContract } from './package-json-contract';
import { PackageJsonStub } from './package-json.stub';

describe('packageJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty stub => parses successfully with no fields', () => {
      const pkg = PackageJsonStub();

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({});
    });

    it('VALID: name only => parses successfully', () => {
      const pkg = PackageJsonStub({ name: '@dungeonmaster/web' });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ name: '@dungeonmaster/web' });
    });

    it('VALID: description only => parses successfully', () => {
      const pkg = PackageJsonStub({ description: 'Shared code' });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ description: 'Shared code' });
    });

    it('VALID: bin as record => parses successfully', () => {
      const pkg = PackageJsonStub({ bin: { dungeonmaster: './dist/bin.js' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ bin: { dungeonmaster: './dist/bin.js' } });
    });

    it('VALID: bin as string => parses successfully', () => {
      const pkg = PackageJsonStub({ bin: './dist/bin.js' });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ bin: './dist/bin.js' });
    });

    it('VALID: dependencies record => parses successfully', () => {
      const pkg = PackageJsonStub({ dependencies: { react: '18.0.0' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ dependencies: { react: '18.0.0' } });
    });

    it('VALID: exports record => parses successfully', () => {
      const pkg = PackageJsonStub({ exports: { '.': './dist/index.js' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ exports: { '.': './dist/index.js' } });
    });

    it('VALID: devDependencies and peerDependencies records => parses successfully', () => {
      const pkg = PackageJsonStub({
        devDependencies: { typescript: '^5.8.3' },
        peerDependencies: { react: '^18.0.0' },
      });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({
        devDependencies: { typescript: '^5.8.3' },
        peerDependencies: { react: '^18.0.0' },
      });
    });

    it('VALID: workspaces list => parses successfully', () => {
      const pkg = PackageJsonStub({ workspaces: ['packages/*'] });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ workspaces: ['packages/*'] });
    });

    it('VALID: scripts record => parses successfully', () => {
      const pkg = PackageJsonStub({ scripts: { test: 'jest' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ scripts: { test: 'jest' } });
    });

    it('VALID: {extra fields} => passes unknown keys through', () => {
      const result = packageJsonContract.parse({ name: 'pkg', version: '1.0.0' });

      expect(result).toStrictEqual({ name: 'pkg', version: '1.0.0' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {workspaces: "string"} => throws validation error', () => {
      expect(() => packageJsonContract.parse({ workspaces: 'packages/*' })).toThrow(
        /expected array/u,
      );
    });

    it('INVALID: {name: 42} => throws validation error', () => {
      expect(() => packageJsonContract.parse({ name: 42 })).toThrow(/expected string/u);
    });

    it('INVALID: non-object input => throws validation error', () => {
      expect(() => {
        packageJsonContract.parse('not-an-object');
      }).toThrow(/expected object/u);
    });
  });
});
