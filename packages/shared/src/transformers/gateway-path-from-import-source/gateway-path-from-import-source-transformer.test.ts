import { gatewayPathFromImportSourceTransformer } from './gateway-path-from-import-source-transformer';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';
import { PackageNameStub } from '../../contracts/package-name/package-name.stub';

describe('gatewayPathFromImportSourceTransformer', () => {
  const scope = PackageNameStub({ value: '@dungeonmaster' });

  it('VALID: {importSource: "fs"} => returns "@dungeonmaster/node/fs"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'fs' }),
      scope,
    });

    expect(result).toBe('@dungeonmaster/node/fs');
  });

  it('VALID: {importSource: "node:fs/promises"} => returns "@dungeonmaster/node/fs/promises"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'node:fs/promises' }),
      scope,
    });

    expect(result).toBe('@dungeonmaster/node/fs/promises');
  });

  it('VALID: {importSource: "zod"} => returns "@dungeonmaster/npm/zod"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'zod' }),
      scope,
    });

    expect(result).toBe('@dungeonmaster/npm/zod');
  });

  it('VALID: {importSource: "node:child_process"} => returns "@dungeonmaster/node/child_process"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'node:child_process' }),
      scope,
    });

    expect(result).toBe('@dungeonmaster/node/child_process');
  });

  it('EDGE: {importSource: "@playwright/test"} => returns "@dungeonmaster/npm/@playwright/test"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: '@playwright/test' }),
      scope,
    });

    expect(result).toBe('@dungeonmaster/npm/@playwright/test');
  });

  it('EDGE: {importSource: "@anthropic-ai/claude-code"} => returns "@dungeonmaster/npm/@anthropic-ai/claude-code"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: '@anthropic-ai/claude-code' }),
      scope,
    });

    expect(result).toBe('@dungeonmaster/npm/@anthropic-ai/claude-code');
  });

  it('EDGE: {scope: "@acme"} => scope is never hard-coded, output reflects the passed scope', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'fs' }),
      scope: PackageNameStub({ value: '@acme' }),
    });

    expect(result).toBe('@acme/node/fs');
  });
});
