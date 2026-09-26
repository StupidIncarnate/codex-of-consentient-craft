import { FileContentsStub } from '@dungeonmaster/shared/contracts';
import { typescriptModuleShapeAdapter } from './typescript-module-shape-adapter';
import { typescriptModuleShapeAdapterProxy } from './typescript-module-shape-adapter.proxy';

describe('typescriptModuleShapeAdapter', () => {
  describe('import declarations', () => {
    it('VALID: {named import} => records a named dependency', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({
          value: "import { readFile } from '@dungeonmaster/node/fs';",
        }),
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
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: "import type { Page } from '@playwright/test';" }),
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: '@playwright/test', kind: 'named', importedNames: ['Page'] }],
        localExportNames: [],
      });
    });

    it('VALID: {default import} => records an opaque dependency', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: "import ts from 'typescript';" }),
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: 'typescript', kind: 'opaque', importedNames: [] }],
        localExportNames: [],
      });
    });

    it('VALID: {namespace import} => records an opaque dependency', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: "import * as ts from 'typescript';" }),
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({
        dependencies: [{ specifier: 'typescript', kind: 'opaque', importedNames: [] }],
        localExportNames: [],
      });
    });

    it('VALID: {side-effect import} => records an opaque dependency', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: "import './side-effect';" }),
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
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({
          value: "export * from './cwd-resolve/cwd-resolve-broker';",
        }),
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
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({
          value: "export { cwdResolveBroker } from './cwd-resolve/cwd-resolve-broker';",
        }),
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
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: "export * as brokers from './brokers';" }),
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
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: 'export const userFetchBroker = async () => {};' }),
        fileName: 'user-fetch-broker.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });

    it('VALID: {export function} => records the local export name', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: 'export function userFetchBroker() {}' }),
        fileName: 'user-fetch-broker.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });

    it('VALID: {export class} => records the local export name', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: 'export class SomeError extends Error {}' }),
        fileName: 'some-error.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['SomeError'] });
    });

    it('VALID: {export type} => records the local export name', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: 'export type FsError = { code: string };' }),
        fileName: 'fs-error.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['FsError'] });
    });

    it('VALID: {export interface} => records the local export name', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: 'export interface FsError { code: string; }' }),
        fileName: 'fs-error.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['FsError'] });
    });

    it('EDGE: {local export list} => records each named local re-export', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({
          value: 'const userFetchBroker = async () => {};\nexport { userFetchBroker };',
        }),
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: ['userFetchBroker'] });
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no statements} => returns empty dependencies and exports', () => {
      typescriptModuleShapeAdapterProxy();
      const result = typescriptModuleShapeAdapter({
        sourceText: FileContentsStub({ value: '' }),
        fileName: 'a.ts',
      });

      expect(result).toStrictEqual({ dependencies: [], localExportNames: [] });
    });
  });
});
