import { isAstNameImportedGuard } from './is-ast-name-imported-guard';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const programImporting = ({ names }: { names: string[] }): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.Program,
    body: [
      TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        specifiers: names.map((name) =>
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name }),
          }),
        ),
      }),
    ],
  });

describe('isAstNameImportedGuard', () => {
  it('VALID: {name among the specifiers} => returns true', () => {
    const result = isAstNameImportedGuard({
      program: programImporting({ names: ['Other', 'Quest'] }),
      name: 'Quest',
    });

    expect(result).toBe(true);
  });

  it('VALID: {name not imported} => returns false', () => {
    const result = isAstNameImportedGuard({
      program: programImporting({ names: ['Other'] }),
      name: 'Quest',
    });

    expect(result).toBe(false);
  });

  it('EMPTY: {program with no statements} => returns false', () => {
    const result = isAstNameImportedGuard({
      program: TsestreeStub({ type: TsestreeNodeType.Program, body: [] }),
      name: 'Quest',
    });

    expect(result).toBe(false);
  });
});
