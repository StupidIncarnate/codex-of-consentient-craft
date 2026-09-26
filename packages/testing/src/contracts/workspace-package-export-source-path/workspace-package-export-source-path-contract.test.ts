import { workspacePackageExportSourcePathContract } from './workspace-package-export-source-path-contract';
import { WorkspacePackageExportSourcePathStub } from './workspace-package-export-source-path.stub';

describe('workspacePackageExportSourcePathContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "./src/testing/index.ts"} => parses successfully', () => {
      const result = WorkspacePackageExportSourcePathStub({ value: './src/testing/index.ts' });

      expect(result).toBe('./src/testing/index.ts');
    });

    it('VALID: {value: "./testing.ts"} => parses successfully', () => {
      const result = WorkspacePackageExportSourcePathStub({ value: './testing.ts' });

      expect(result).toBe('./testing.ts');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws a Zod validation error', () => {
      expect(() => workspacePackageExportSourcePathContract.parse(123 as never)).toThrow(
        /Expected string, received number/u,
      );
    });
  });
});
