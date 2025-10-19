import { TsestreeStub } from '../../contracts/tsestree/tsestree.stub';
import { isAstNodeExportedGuard } from './is-ast-node-exported-guard';

describe('isAstNodeExportedGuard', () => {
  it('VALID: {node with ExportNamedDeclaration parent} => returns true', () => {
    const node = TsestreeStub({
      type: 'VariableDeclarator',
      parent: TsestreeStub({
        type: 'VariableDeclaration',
        parent: TsestreeStub({
          type: 'ExportNamedDeclaration',
        }),
      }),
    });

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with ExportDefaultDeclaration parent} => returns true', () => {
    const node = TsestreeStub({
      type: 'FunctionDeclaration',
      parent: TsestreeStub({
        type: 'ExportDefaultDeclaration',
      }),
    });

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with export ancestor} => returns true', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: TsestreeStub({
        type: 'VariableDeclarator',
        parent: TsestreeStub({
          type: 'VariableDeclaration',
          parent: TsestreeStub({
            type: 'ExportNamedDeclaration',
            parent: TsestreeStub({
              type: 'Program',
            }),
          }),
        }),
      }),
    });

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with non-export parents} => returns false', () => {
    const node = TsestreeStub({
      type: 'VariableDeclarator',
      parent: TsestreeStub({
        type: 'VariableDeclaration',
        parent: TsestreeStub({
          type: 'Program',
        }),
      }),
    });

    expect(isAstNodeExportedGuard({ node })).toBe(false);
  });

  it('EMPTY: {node without parent} => returns false', () => {
    const node = TsestreeStub({
      type: 'Identifier',
      parent: null,
    });

    expect(isAstNodeExportedGuard({ node })).toBe(false);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isAstNodeExportedGuard({ node: undefined })).toBe(false);
  });
});
