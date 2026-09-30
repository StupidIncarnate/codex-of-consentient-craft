import { typescriptModuleShapeTransformer } from './typescript-module-shape-transformer';

describe('typescriptModuleShapeTransformer', () => {
  describe('import declarations', () => {
    it('VALID: {named import} => records a named dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "import { readFile } from '@dungeonmaster/node/fs';",
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [
          { specifier: '@dungeonmaster/node/fs', kind: 'named', importedNames: ['readFile'] },
        ],
        localExportNames: [],
      });
    });

    it('VALID: {type-only named import} => still records a named dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "import type { Page } from '@playwright/test';",
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: '@playwright/test', kind: 'named', importedNames: ['Page'] }],
        localExportNames: [],
      });
    });

    it('VALID: {default import} => records an opaque dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "import ts from 'typescript';",
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: 'typescript', kind: 'opaque', importedNames: [] }],
        localExportNames: [],
      });
    });

    it('VALID: {namespace import} => records an opaque dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "import * as ts from 'typescript';",
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: 'typescript', kind: 'opaque', importedNames: [] }],
        localExportNames: [],
      });
    });

    it('VALID: {side-effect import} => records an opaque dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "import './side-effect';",
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: './side-effect', kind: 'opaque', importedNames: [] }],
        localExportNames: [],
      });
    });
  });

  describe('re-export declarations', () => {
    it('VALID: {export * from} => records a star dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "export * from './cwd-resolve/cwd-resolve-broker';",
        fileName: 'brokers.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [
          { specifier: './cwd-resolve/cwd-resolve-broker', kind: 'star', importedNames: [] },
        ],
        localExportNames: [],
      });
    });

    it('VALID: {export {a} from} => records a named dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "export { cwdResolveBroker } from './cwd-resolve/cwd-resolve-broker';",
        fileName: 'brokers.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [
          {
            specifier: './cwd-resolve/cwd-resolve-broker',
            kind: 'named',
            importedNames: ['cwdResolveBroker'],
          },
        ],
        localExportNames: [],
      });
    });

    it('EDGE: {export * as ns from} => records an opaque dependency', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: "export * as brokers from './brokers';",
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: './brokers', kind: 'opaque', importedNames: [] }],
        localExportNames: [],
      });
    });
  });

  describe('local exports', () => {
    it('VALID: {export const} => records the local export name', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: 'export const userFetchBroker = async () => {};',
        fileName: 'user-fetch-broker.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });

    it('VALID: {export function} => records the local export name', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: 'export function userFetchBroker() {}',
        fileName: 'user-fetch-broker.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });

    it('VALID: {export class} => records the local export name', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: 'export class SomeError extends Error {}',
        fileName: 'some-error.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['SomeError'] });
    });

    it('VALID: {export type} => records the local export name', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: 'export type FsError = { code: string };',
        fileName: 'fs-error.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['FsError'] });
    });

    it('VALID: {export interface} => records the local export name', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: 'export interface FsError { code: string; }',
        fileName: 'fs-error.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['FsError'] });
    });

    it('EDGE: {local export list} => records each named local re-export', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: 'const userFetchBroker = async () => {};\nexport { userFetchBroker };',
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no statements} => returns empty dependencies and exports', () => {
      const result = typescriptModuleShapeTransformer({
        sourceText: '',
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: [] });
    });
  });
});
