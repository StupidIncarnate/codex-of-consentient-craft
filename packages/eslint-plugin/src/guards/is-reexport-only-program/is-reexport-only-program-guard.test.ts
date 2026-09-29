import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

import { isReexportOnlyProgramGuard } from './is-reexport-only-program-guard';

describe('isReexportOnlyProgramGuard', () => {
  it('VALID: {body: export * from} => returns true', () => {
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportAllDeclaration,
          source: TsestreeStub({ type: TsestreeNodeType.Literal }),
        }),
      ],
    });

    expect(isReexportOnlyProgramGuard({ node })).toBe(true);
  });

  it('VALID: {body: export { x } from} => returns true', () => {
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportNamedDeclaration,
          declaration: null,
          source: TsestreeStub({ type: TsestreeNodeType.Literal }),
        }),
      ],
    });

    expect(isReexportOnlyProgramGuard({ node })).toBe(true);
  });

  it('EMPTY: {body: []} => returns true', () => {
    const node = TsestreeStub({ type: TsestreeNodeType.Program, body: [] });

    expect(isReexportOnlyProgramGuard({ node })).toBe(true);
  });

  it('EMPTY: {node: undefined} => returns false', () => {
    expect(isReexportOnlyProgramGuard({})).toBe(false);
  });

  it('INVALID: {body: export const} => returns false', () => {
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportNamedDeclaration,
          declaration: TsestreeStub({ type: TsestreeNodeType.VariableDeclaration }),
          source: null,
        }),
      ],
    });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: export { x } with no source} => returns false', () => {
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ExportNamedDeclaration,
          declaration: null,
          source: null,
        }),
      ],
    });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: an import beside a re-export} => returns false', () => {
    const node = TsestreeStub({
      type: TsestreeNodeType.Program,
      body: [
        TsestreeStub({
          type: TsestreeNodeType.ImportDeclaration,
          source: TsestreeStub({ type: TsestreeNodeType.Literal }),
        }),
        TsestreeStub({
          type: TsestreeNodeType.ExportAllDeclaration,
          source: TsestreeStub({ type: TsestreeNodeType.Literal }),
        }),
      ],
    });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });

  it('INVALID: {body: not an array} => returns false', () => {
    const node = TsestreeStub({ type: TsestreeNodeType.Program });

    expect(isReexportOnlyProgramGuard({ node })).toBe(false);
  });
});
