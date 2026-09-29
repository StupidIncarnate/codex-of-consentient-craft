import { ProgramStub } from '#gateway/npm/typescript-eslint__utils/program/program.stub';
import { isAstNameImportedGuard } from './is-ast-name-imported-guard';

describe('isAstNameImportedGuard', () => {
  it('VALID: {name among the specifiers} => returns true', () => {
    const result = isAstNameImportedGuard({
      program: ProgramStub({ code: 'import { Other, Quest } from "./quest";' }),
      name: 'Quest',
    });

    expect(result).toBe(true);
  });

  it('VALID: {name not imported} => returns false', () => {
    const result = isAstNameImportedGuard({
      program: ProgramStub({ code: 'import { Other } from "./quest";' }),
      name: 'Quest',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {program with no statements} => returns false', () => {
    const result = isAstNameImportedGuard({
      program: ProgramStub({ code: '' }),
      name: 'Quest',
    });

    expect(result).toBe(false);
  });
});
