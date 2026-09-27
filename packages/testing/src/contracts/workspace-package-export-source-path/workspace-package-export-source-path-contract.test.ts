import { workspacePackageExportSourcePathContract } from './workspace-package-export-source-path-contract';
import { WorkspacePackageExportSourcePathStub } from './workspace-package-export-source-path.stub';

describe('workspacePackageExportSourcePathContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "./src/glob/glob.ts"} => parses successfully', () => {
      const result = WorkspacePackageExportSourcePathStub({ value: './src/glob/glob.ts' });

      expect(result).toBe('./src/glob/glob.ts');
    });

    it('VALID: {value: "./testing.ts"} => parses successfully', () => {
      const result = WorkspacePackageExportSourcePathStub({ value: './testing.ts' });

      expect(result).toBe('./testing.ts');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 123} => throws a Zod validation error', () => {
      expect(() => workspacePackageExportSourcePathContract.parse(123 as never)).toThrow(
        /Invalid input: expected string, received number/u,
      );
    });
  });
});
