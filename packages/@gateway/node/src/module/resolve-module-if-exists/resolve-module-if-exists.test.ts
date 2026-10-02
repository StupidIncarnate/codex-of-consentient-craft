import { dirname, join } from 'path';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from '../../os/os';
import { resolveModuleIfExists } from './resolve-module-if-exists';

describe('resolveModuleIfExists', () => {
  it('VALID: {specifier: an installed package, fromDir} => returns the file resolved from fromDir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-resolve-'));
    const packageDir = join(dir, 'node_modules', 'fake-pkg');
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(join(packageDir, 'package.json'), '{"name":"fake-pkg","main":"index.js"}');
    writeFileSync(join(packageDir, 'index.js'), 'module.exports = 1;');

    const result = resolveModuleIfExists({ specifier: 'fake-pkg/package.json', fromDir: dir });

    rmSync(dir, { recursive: true, force: true });

    expect(result).toBe(join(packageDir, 'package.json'));
  });

  it('VALID: {specifier: an installed package, no fromDir} => resolves from this process own install', () => {
    const result = resolveModuleIfExists({ specifier: 'zod/package.json' });

    expect(dirname(String(result)).endsWith(join('node_modules', 'zod'))).toBe(true);
  });

  it('EMPTY: {specifier: a package nobody installed} => returns null', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-resolve-'));

    const result = resolveModuleIfExists({
      specifier: 'dm-definitely-not-installed-pkg/package.json',
      fromDir: dir,
    });

    rmSync(dir, { recursive: true, force: true });

    expect(result).toBe(null);
  });

  it('ERROR: {specifier: not a string} => rethrows the error that is not a not-found', () => {
    const act = (): string | null => resolveModuleIfExists({ specifier: 42 as never });

    expect(act).toThrow(
      /^The "path" argument must be of type string\. Received type number \(42\)$/u,
    );
  });
});
