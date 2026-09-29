import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { astProgramDeclaratorsTransformer } from './ast-program-declarators-transformer';

const code = "const localFields;\nexport const questContract;\nimport 'x';";
const program = ProgramStub({ code });

describe('astProgramDeclaratorsTransformer', () => {
  describe('every top-level declarator', () => {
    it('VALID: {localOnly: false} => returns the local and the exported declarator', () => {
      const result = astProgramDeclaratorsTransformer({ program, localOnly: false });

      expect(result.map((declarator) => code.slice(...declarator.id.range))).toStrictEqual([
        'localFields',
        'questContract',
      ]);
    });
  });

  describe('only the local declarators', () => {
    it('VALID: {localOnly: true} => returns the unexported declarator alone', () => {
      const result = astProgramDeclaratorsTransformer({ program, localOnly: true });

      expect(result.map((declarator) => code.slice(...declarator.id.range))).toStrictEqual([
        'localFields',
      ]);
    });
  });
});
