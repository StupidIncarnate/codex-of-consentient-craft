import { astImportInsertAnchorTransformer } from './ast-import-insert-anchor-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

const importFrom = ({
  source,
  importKind,
  specifiers,
}: {
  source: string;
  importKind: 'type' | 'value';
  specifiers: ReturnType<typeof TsestreeStub>[];
}): ReturnType<typeof TsestreeStub> =>
  TsestreeStub({
    type: TsestreeNodeType.ImportDeclaration,
    importKind,
    source: TsestreeStub({ type: TsestreeNodeType.Literal, value: source }),
    specifiers,
  });

describe('astImportInsertAnchorTransformer', () => {
  describe('an existing import of the same module and kind', () => {
    it('VALID: {type import from the same source} => returns its last specifier', () => {
      const first = TsestreeStub({
        type: TsestreeNodeType.ImportSpecifier,
        local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'First' }),
      });
      const last = TsestreeStub({
        type: TsestreeNodeType.ImportSpecifier,
        local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'Last' }),
      });
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          importFrom({ source: './a', importKind: 'type', specifiers: [first, last] }),
          importFrom({ source: './b', importKind: 'value', specifiers: [] }),
        ],
      });

      const result = astImportInsertAnchorTransformer({
        program,
        source: './a',
        importKind: 'type',
      });

      expect(result).toStrictEqual(last);
    });
  });

  describe('no import of that module and kind', () => {
    it('VALID: {same source, other kind} => returns the last import of the file', () => {
      const lastImport = importFrom({ source: './b', importKind: 'value', specifiers: [] });
      const program = TsestreeStub({
        type: TsestreeNodeType.Program,
        body: [
          importFrom({
            source: './a',
            importKind: 'value',
            specifiers: [TsestreeStub({ type: TsestreeNodeType.ImportSpecifier })],
          }),
          lastImport,
        ],
      });

      const result = astImportInsertAnchorTransformer({
        program,
        source: './a',
        importKind: 'type',
      });

      expect(result).toStrictEqual(lastImport);
    });

    it('EMPTY: {file with no import} => returns null', () => {
      const program = TsestreeStub({ type: TsestreeNodeType.Program, body: [] });

      const result = astImportInsertAnchorTransformer({
        program,
        source: './a',
        importKind: 'type',
      });

      expect(result).toBe(null);
    });
  });
});
