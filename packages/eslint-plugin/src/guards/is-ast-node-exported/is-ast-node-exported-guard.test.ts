import { isAstNodeExportedGuard } from './is-ast-node-exported-guard';
import type { Tsestree } from '../../contracts/tsestree/tsestree-contract';

describe('isAstNodeExportedGuard', () => {
  it('VALID: {node with ExportNamedDeclaration parent} => returns true', () => {
    const node = {
      type: 'VariableDeclarator',
      parent: {
        type: 'VariableDeclaration',
        parent: {
          type: 'ExportNamedDeclaration',
        },
      },
    } as Tsestree;

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with ExportDefaultDeclaration parent} => returns true', () => {
    const node = {
      type: 'FunctionDeclaration',
      parent: {
        type: 'ExportDefaultDeclaration',
      },
    } as Tsestree;

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with export ancestor} => returns true', () => {
    const node = {
      type: 'Identifier',
      parent: {
        type: 'VariableDeclarator',
        parent: {
          type: 'VariableDeclaration',
          parent: {
            type: 'ExportNamedDeclaration',
            parent: {
              type: 'Program',
            },
          },
        },
      },
    } as Tsestree;

    expect(isAstNodeExportedGuard({ node })).toBe(true);
  });

  it('VALID: {node with non-export parents} => returns false', () => {
    const node = {
      type: 'VariableDeclarator',
      parent: {
        type: 'VariableDeclaration',
        parent: {
          type: 'Program',
        },
      },
    } as Tsestree;

    expect(isAstNodeExportedGuard({ node })).toBe(false);
  });

  it('EMPTY: {node without parent} => returns false', () => {
    const node = {
      type: 'Identifier',
    } as Tsestree;

    expect(isAstNodeExportedGuard({ node })).toBe(false);
  });
});
