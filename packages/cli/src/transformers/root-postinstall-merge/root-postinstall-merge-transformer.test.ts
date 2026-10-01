import { PackageJsonRawStub } from '@dungeonmaster/shared/contracts/package-json-raw/package-json-raw.stub';
import { rootPostinstallMergeTransformer } from './root-postinstall-merge-transformer';

describe('rootPostinstallMergeTransformer', () => {
  it('EMPTY: {scripts: absent} => creates scripts with postinstall running the sync', () => {
    const rootPackageJson = PackageJsonRawStub({});

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('VALID: {scripts: other scripts, no postinstall} => adds postinstall after the existing scripts', () => {
    const rootPackageJson = PackageJsonRawStub({ scripts: { build: 'tsc', test: 'jest' } });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        build: 'tsc',
        test: 'jest',
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('VALID: {scripts.postinstall: "husky"} => appends the sync after the existing command', () => {
    const rootPackageJson = PackageJsonRawStub({ scripts: { postinstall: 'husky' } });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        postinstall:
          'husky && if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('EDGE: {scripts.postinstall: whitespace only} => replaces it with the sync alone', () => {
    const rootPackageJson = PackageJsonRawStub({ scripts: { postinstall: '  ' } });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('EDGE: {scripts.postinstall: a number} => replaces it with the sync alone', () => {
    const rootPackageJson = PackageJsonRawStub({ scripts: { postinstall: 1 } });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('EDGE: {scripts: an array} => replaces it with scripts holding only the postinstall', () => {
    const rootPackageJson = PackageJsonRawStub({ scripts: ['build'] });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('EDGE: {scripts: null} => replaces it with scripts holding only the postinstall', () => {
    const rootPackageJson = PackageJsonRawStub({ scripts: null });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toStrictEqual({
      name: 'stub-project',
      version: '1.0.0',
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });
  });

  it('VALID: {scripts.postinstall: already "dungeonmaster gateway-sync"} => returns the same reference unchanged', () => {
    const rootPackageJson = PackageJsonRawStub({
      scripts: {
        postinstall:
          'if command -v dungeonmaster >/dev/null 2>&1; then dungeonmaster gateway-sync; fi',
      },
    });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toBe(rootPackageJson);
  });

  it('VALID: {scripts.postinstall: mentions gateway-sync among other commands} => returns the same reference unchanged', () => {
    const rootPackageJson = PackageJsonRawStub({
      scripts: { postinstall: 'husky && npx dungeonmaster gateway-sync' },
    });

    const result = rootPostinstallMergeTransformer({ rootPackageJson });

    expect(result).toBe(rootPackageJson);
  });
});
