import { gatewayBarrelExportedNamesTransformer } from './gateway-barrel-exported-names-transformer';

describe('gatewayBarrelExportedNamesTransformer', () => {
  describe('direct named re-exports', () => {
    it('VALID: {sourceText: one named re-export} => returns its name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: "export { readFile } from './read-file/read-file';\n",
      });

      expect(result).toStrictEqual({ directNames: ['readFile'], reexportTargets: [] });
    });

    it('VALID: {sourceText: several named re-exports on separate lines} => returns every name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: [
          "export { appendFile } from './append-file/append-file';",
          "export { readFile } from './read-file/read-file';",
          "export { writeFile } from './write-file/write-file';",
        ].join('\n'),
      });

      expect(result.directNames.sort()).toStrictEqual(['appendFile', 'readFile', 'writeFile']);
    });

    it('VALID: {sourceText: renamed re-export} => returns the exported-as name, not the source name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: "export { internalName as readFile } from './internal';\n",
      });

      expect(result.directNames).toStrictEqual(['readFile']);
    });
  });

  describe('direct declarations', () => {
    it('VALID: {sourceText: export const} => returns its name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: 'export const readFile = async () => {};\n',
      });

      expect(result.directNames).toStrictEqual(['readFile']);
    });

    it('VALID: {sourceText: export function} => returns its name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: 'export function readFile() {}\n',
      });

      expect(result.directNames).toStrictEqual(['readFile']);
    });

    it('VALID: {sourceText: export class} => returns its name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: 'export class FsError extends Error {}\n',
      });

      expect(result.directNames).toStrictEqual(['FsError']);
    });
  });

  describe('namespace re-export', () => {
    it('VALID: {sourceText: export * as ns from} => returns the namespace name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: "export * as posix from 'path/posix';\n",
      });

      expect(result.directNames).toStrictEqual(['posix']);
    });
  });

  describe('type-only exports', () => {
    it('EMPTY: {sourceText: export type {...} from} => is not counted as a direct name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: "export type { FsError } from './is-fs-error/fs-error';\n",
      });

      expect(result.directNames).toStrictEqual([]);
    });

    it('VALID: {sourceText: mixed value and per-name type export} => keeps only the value name', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: "export { readFile, type FileStat } from './read-file/read-file';\n",
      });

      expect(result.directNames).toStrictEqual(['readFile']);
    });
  });

  describe('passthrough re-export targets', () => {
    it('VALID: {sourceText: export * from a bare specifier} => returns the target specifier', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: "export * from 'fs/promises';\n",
      });

      expect(result.reexportTargets).toStrictEqual(['fs/promises']);
    });

    it('VALID: {sourceText: named exports plus a passthrough} => returns both shapes', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: [
          "export * from 'fs/promises';",
          "export { appendFile } from './append-file/append-file';",
        ].join('\n'),
      });

      expect(result).toStrictEqual({
        directNames: ['appendFile'],
        reexportTargets: ['fs/promises'],
      });
    });
  });

  describe('empty source', () => {
    it('EMPTY: {sourceText: no exports} => returns empty arrays', () => {
      const result = gatewayBarrelExportedNamesTransformer({
        sourceText: '/** PURPOSE: nothing to see */\n',
      });

      expect(result).toStrictEqual({ directNames: [], reexportTargets: [] });
    });
  });
});
