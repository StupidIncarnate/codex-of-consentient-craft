import { astGetImportsTransformer } from './ast-get-imports-transformer';
import { TsestreeStub, TsestreeNodeType } from '../../contracts/tsestree/tsestree.stub';

describe('astGetImportsTransformer', () => {
  describe('named imports', () => {
    it("VALID: {node: ImportDeclaration with named import} => returns Map with 'foo' => 'bar'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'bar' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['foo', 'bar']]));
    });

    it('VALID: {node: ImportDeclaration with multiple named imports} => returns Map with all imports', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'package' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'first' }),
          }),
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'second' }),
          }),
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'third' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(
        new Map([
          ['first', 'package'],
          ['second', 'package'],
          ['third', 'package'],
        ]),
      );
    });
  });

  describe('default imports', () => {
    it("VALID: {node: ImportDeclaration with default import} => returns Map with 'axios' => 'axios'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'axios' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportDefaultSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'axios' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['axios', 'axios']]));
    });
  });

  describe('namespace imports', () => {
    it("VALID: {node: ImportDeclaration with namespace import} => returns Map with 'fs' => 'fs/promises'", () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'fs/promises' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportNamespaceSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'fs' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['fs', 'fs/promises']]));
    });
  });

  describe('mixed imports', () => {
    it('VALID: {node: ImportDeclaration with default + named imports} => returns Map with all imports', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'react' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportDefaultSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'React' }),
          }),
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'useState' }),
          }),
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'useEffect' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(
        new Map([
          ['React', 'react'],
          ['useState', 'react'],
          ['useEffect', 'react'],
        ]),
      );
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {} => returns empty Map', () => {
      const result = astGetImportsTransformer({});

      expect(result).toStrictEqual(new Map());
    });

    it('EMPTY: {node: non-ImportDeclaration} => returns empty Map', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ExportNamedDeclaration,
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map());
    });

    it('EMPTY: {node: ImportDeclaration with no source} => returns empty Map', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: undefined,
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map());
    });

    it('EMPTY: {node: ImportDeclaration with non-string source} => returns empty Map', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 123 }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'foo' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map());
    });

    it('EMPTY: {node: ImportDeclaration with no specifiers} => returns empty Map', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'bar' }),
        specifiers: [],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map());
    });

    it('EDGE: {node: ImportDeclaration with specifier missing local name} => skips that specifier', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: 'package' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'valid' }),
          }),
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: undefined,
          }),
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: undefined }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['valid', 'package']]));
    });
  });

  describe('relative paths', () => {
    it('VALID: {node: ImportDeclaration from relative path} => returns Map with import', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: './user-broker.proxy' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'userBrokerProxy' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['userBrokerProxy', './user-broker.proxy']]));
    });

    it('VALID: {node: ImportDeclaration from parent path} => returns Map with import', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({
          type: TsestreeNodeType.Literal,
          value: '../../adapters/http/http-adapter',
        }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'httpAdapter' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['httpAdapter', '../../adapters/http/http-adapter']]));
    });
  });

  describe('scoped packages', () => {
    it('VALID: {node: ImportDeclaration from scoped package} => returns Map with import', () => {
      const node = TsestreeStub({
        type: TsestreeNodeType.ImportDeclaration,
        source: TsestreeStub({ type: TsestreeNodeType.Literal, value: '@questmaestro/shared' }),
        specifiers: [
          TsestreeStub({
            type: TsestreeNodeType.ImportSpecifier,
            local: TsestreeStub({ type: TsestreeNodeType.Identifier, name: 'filePathContract' }),
          }),
        ],
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['filePathContract', '@questmaestro/shared']]));
    });
  });
});
