import { gatewayPathFromImportSourceTransformer } from './gateway-path-from-import-source-transformer';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('gatewayPathFromImportSourceTransformer', () => {
  it('VALID: {importSource: "fs"} => returns "#gateway/node/fs"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'fs' }),
    });

    expect(result).toBe('#gateway/node/fs');
  });

  it('VALID: {importSource: "node:fs/promises"} => returns "#gateway/node/fs/promises"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'node:fs/promises' }),
    });

    expect(result).toBe('#gateway/node/fs/promises');
  });

  it('VALID: {importSource: "zod"} => returns "#gateway/npm/zod"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'zod' }),
    });

    expect(result).toBe('#gateway/npm/zod');
  });

  it('VALID: {importSource: "node:child_process"} => returns "#gateway/node/child_process"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: 'node:child_process' }),
    });

    expect(result).toBe('#gateway/node/child_process');
  });

  it('EDGE: {importSource: "@playwright/test"} => returns "#gateway/npm/@playwright/test"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: '@playwright/test' }),
    });

    expect(result).toBe('#gateway/npm/@playwright/test');
  });

  it('EDGE: {importSource: "@anthropic-ai/claude-code"} => returns "#gateway/npm/@anthropic-ai/claude-code"', () => {
    const result = gatewayPathFromImportSourceTransformer({
      importSource: ImportPathStub({ value: '@anthropic-ai/claude-code' }),
    });

    expect(result).toBe('#gateway/npm/@anthropic-ai/claude-code');
  });
});
