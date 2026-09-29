import { importInsertTextTransformer } from './import-insert-text-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('importInsertTextTransformer', () => {
  describe('an existing import of the module', () => {
    it('VALID: {specifier anchor} => adds the name after it', () => {
      const result = importInsertTextTransformer({
        anchor: TsestreeStub({ type: TsestreeNodeType.ImportSpecifier }),
        name: 'Quest',
        source: '../quest/quest-contract',
        importKind: 'type',
      });

      expect(result).toBe(', Quest');
    });
  });

  describe('a new import statement', () => {
    it('VALID: {declaration anchor, type import} => a type import on its own line', () => {
      const result = importInsertTextTransformer({
        anchor: TsestreeStub({ type: TsestreeNodeType.ImportDeclaration }),
        name: 'Quest',
        source: '../quest/quest-contract',
        importKind: 'type',
      });

      expect(result).toBe("\nimport type { Quest } from '../quest/quest-contract';");
    });

    it('VALID: {declaration anchor, value import} => a value import on its own line', () => {
      const result = importInsertTextTransformer({
        anchor: TsestreeStub({ type: TsestreeNodeType.ImportDeclaration }),
        name: 'questContract',
        source: '../quest/quest-contract',
        importKind: 'value',
      });

      expect(result).toBe("\nimport { questContract } from '../quest/quest-contract';");
    });

    it('EMPTY: {no anchor} => the statement with a trailing newline', () => {
      const result = importInsertTextTransformer({
        anchor: null,
        name: 'Quest',
        source: '@repo/b/contracts',
        importKind: 'type',
      });

      expect(result).toBe("import type { Quest } from '@repo/b/contracts';\n");
    });
  });
});
