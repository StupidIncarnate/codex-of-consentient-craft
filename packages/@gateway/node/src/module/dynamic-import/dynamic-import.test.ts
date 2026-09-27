import { join } from 'path';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from '../../os/os';
import { dynamicImport } from './dynamic-import';

describe('dynamicImport', () => {
  it('VALID: {path: a real module} => returns its module namespace object', async () => {
    const result = await dynamicImport({
      path: './dynamic-import',
    });

    const { dynamicImport: reimportedDynamicImport } = result as { dynamicImport: unknown };

    expect(reimportedDynamicImport).toBe(dynamicImport);
  });

  it("ERROR: {path: a module that does not exist} => rejects with Node's own module-not-found error", async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-module-'));
    const missingPath = join(dir, 'does-not-exist.js');

    const caught: unknown = await dynamicImport({ path: missingPath }).catch(
      (rejection: unknown) => rejection,
    );

    rmSync(dir, { recursive: true, force: true });

    expect((caught as Error).message).toBe(
      `Cannot find module '${missingPath}' from 'src/module/dynamic-import/dynamic-import.ts'`,
    );
  });

  it('ERROR: {path: a file with a syntax error} => rejects with a real SyntaxError, unreshaped', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dm-node-module-'));
    const brokenPath = join(dir, 'broken-syntax.js');
    writeFileSync(brokenPath, 'module.exports = {\n  value: 1\n');

    const caught: unknown = await dynamicImport({ path: brokenPath }).catch(
      (rejection: unknown) => rejection,
    );

    rmSync(dir, { recursive: true, force: true });

    expect((caught as SyntaxError).name).toBe('SyntaxError');
  });
});
