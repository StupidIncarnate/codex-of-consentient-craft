import { typeDiagnosticContract } from './type-diagnostic-contract';
import { TypeDiagnosticStub } from './type-diagnostic.stub';
import { RepoRelativePathStub, LineCountStub } from '@dungeonmaster/shared/contracts';

describe('typeDiagnosticContract', () => {
  describe('valid diagnostics', () => {
    it('VALID: {file, line, code: 2353, message} => returns all four', () => {
      const result = TypeDiagnosticStub({
        file: RepoRelativePathStub({
          value: 'packages/hydration/test/type-fixtures/call-site/bad-expect.ts',
        }),
        line: LineCountStub({ value: 7 }),
        code: 2353,
        message:
          "Object literal may only specify known properties, and 'nope' does not exist in type 'FilterArgs'.",
      });

      expect(result).toStrictEqual({
        file: 'packages/hydration/test/type-fixtures/call-site/bad-expect.ts',
        line: 7,
        code: 2353,
        message:
          "Object literal may only specify known properties, and 'nope' does not exist in type 'FilterArgs'.",
      });
    });
  });

  describe('invalid diagnostics', () => {
    it('INVALID: {code: 0} => throws "Number must be greater than 0"', () => {
      expect(() =>
        typeDiagnosticContract.parse({
          file: RepoRelativePathStub({
            value: 'packages/hydration/test/type-fixtures/call-site/bad-expect.ts',
          }),
          line: LineCountStub({ value: 7 }),
          code: 0,
          message: 'irrelevant',
        }),
      ).toThrow(/Number must be greater than 0/u);
    });
  });
});
