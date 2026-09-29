import { ImportDeclarationStub } from '#gateway/npm/typescript-eslint__utils/import-declaration/import-declaration.stub';
import { ExportNamedDeclarationStub } from '#gateway/npm/typescript-eslint__utils/export-named-declaration/export-named-declaration.stub';
import { astGetImportsTransformer } from './ast-get-imports-transformer';

describe('astGetImportsTransformer', () => {
  describe('named imports', () => {
    it("VALID: {node: ImportDeclaration with named import} => returns Map with 'foo' => 'bar'", () => {
      const node = ImportDeclarationStub({ code: 'import { x as foo } from "bar";' });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['foo', 'bar']]));
    });

    it('VALID: {node: ImportDeclaration with multiple named imports} => returns Map with all imports', () => {
      const node = ImportDeclarationStub({
        code: 'import { x as first, x as second, x as third } from "package";',
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
      const node = ImportDeclarationStub({ code: 'import axios from "axios";' });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['axios', 'axios']]));
    });
  });

  describe('namespace imports', () => {
    it("VALID: {node: ImportDeclaration with namespace import} => returns Map with 'fs' => 'fs/promises'", () => {
      const node = ImportDeclarationStub({ code: 'import * as fs from "fs/promises";' });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['fs', 'fs/promises']]));
    });
  });

  describe('mixed imports', () => {
    it('VALID: {node: ImportDeclaration with default + named imports} => returns Map with all imports', () => {
      const node = ImportDeclarationStub({
        code: 'import React, { x as useState, x as useEffect } from "react";',
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
      const node = ExportNamedDeclarationStub({ code: 'export {  };' });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map());
    });

    it('EMPTY: {node: ImportDeclaration with no specifiers} => returns empty Map', () => {
      const node = ImportDeclarationStub({ code: 'import "bar";' });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map());
    });
  });

  describe('relative paths', () => {
    it('VALID: {node: ImportDeclaration from relative path} => returns Map with import', () => {
      const node = ImportDeclarationStub({
        code: 'import { x as userBrokerProxy } from "./user-broker.proxy";',
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['userBrokerProxy', './user-broker.proxy']]));
    });

    it('VALID: {node: ImportDeclaration from parent path} => returns Map with import', () => {
      const node = ImportDeclarationStub({
        code: 'import { x as httpAdapter } from "../../adapters/http/http-adapter";',
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['httpAdapter', '../../adapters/http/http-adapter']]));
    });
  });

  describe('scoped packages', () => {
    it('VALID: {node: ImportDeclaration from scoped package} => returns Map with import', () => {
      const node = ImportDeclarationStub({
        code: 'import { x as filePathContract } from "@dungeonmaster/shared";',
      });

      const result = astGetImportsTransformer({ node });

      expect(result).toStrictEqual(new Map([['filePathContract', '@dungeonmaster/shared']]));
    });
  });
});
