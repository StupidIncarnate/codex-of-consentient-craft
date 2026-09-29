import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { astImportInsertAnchorTransformer } from './ast-import-insert-anchor-transformer';

describe('astImportInsertAnchorTransformer', () => {
  describe('an existing import of the same module and kind', () => {
    it('VALID: {type import from the same source} => returns its last specifier', () => {
      const code = 'import type { x as First, x as Last } from "./a";\nimport "./b";';
      const program = ProgramStub({ code });

      const result = astImportInsertAnchorTransformer({
        program,
        source: './a',
        importKind: 'type',
      });

      expect(result?.type).toBe('ImportSpecifier');
      expect(result?.range).toStrictEqual([26, 35]);
    });
  });

  describe('no import of that module and kind', () => {
    it('VALID: {same source, other kind} => returns the last import of the file', () => {
      const code = 'import { x } from "./a";\nimport "./b";';
      const program = ProgramStub({ code });

      const result = astImportInsertAnchorTransformer({
        program,
        source: './a',
        importKind: 'type',
      });

      expect(result?.type).toBe('ImportDeclaration');
      expect(result?.range).toStrictEqual([25, 38]);
    });

    it('EMPTY: {file with no import} => returns null', () => {
      const program = ProgramStub({ code: '' });

      const result = astImportInsertAnchorTransformer({
        program,
        source: './a',
        importKind: 'type',
      });

      expect(result).toBe(null);
    });
  });
});
