import { typescriptProgramDiagnosticsAdapter } from './typescript-program-diagnostics-adapter';
import { typescriptProgramDiagnosticsAdapterProxy } from './typescript-program-diagnostics-adapter.proxy';
import { TypeDiagnosticStub } from '../../../contracts/type-diagnostic/type-diagnostic.stub';
import { RepoRelativePathStub, LineCountStub } from '@dungeonmaster/shared/contracts';

// ONE ts.createProgram for the whole suite — a program per test measured 1.1-1.4s each against
// ward's 1000ms testWarnMs bar. Both fixtures ride the same program call, since the adapter
// already accepts multiple files per program; each test reads its own file's slice of the result.
const CLEAN_FIXTURE = RepoRelativePathStub({
  value: 'packages/hydration/test/adapter-fixtures/clean.ts',
});
const ONE_ERROR_FIXTURE = RepoRelativePathStub({
  value: 'packages/hydration/test/adapter-fixtures/one-error.ts',
});
const suiteDiagnostics = typescriptProgramDiagnosticsAdapter({
  files: [CLEAN_FIXTURE, ONE_ERROR_FIXTURE],
});

describe('typescriptProgramDiagnosticsAdapter', () => {
  describe('a program with no errors', () => {
    it('VALID: {files: [clean fixture]} => returns no diagnostics', () => {
      typescriptProgramDiagnosticsAdapterProxy();

      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === CLEAN_FIXTURE);

      expect(result).toStrictEqual([]);
    });
  });

  describe('a program with one deliberate error', () => {
    it('VALID: {files: [fixture with one error]} => returns that diagnostic', () => {
      typescriptProgramDiagnosticsAdapterProxy();

      const result = suiteDiagnostics.filter((diagnostic) => diagnostic.file === ONE_ERROR_FIXTURE);

      expect(result).toStrictEqual([
        TypeDiagnosticStub({
          file: ONE_ERROR_FIXTURE,
          line: LineCountStub({ value: 1 }),
          code: 2322,
          message: "Type 'number' is not assignable to type 'string'.",
        }),
      ]);
    });
  });
});
