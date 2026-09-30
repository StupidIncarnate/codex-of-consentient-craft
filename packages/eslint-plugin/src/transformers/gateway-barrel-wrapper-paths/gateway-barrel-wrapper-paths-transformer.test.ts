import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { gatewayBarrelWrapperPathsTransformer } from './gateway-barrel-wrapper-paths-transformer';

describe('gatewayBarrelWrapperPathsTransformer', () => {
  it('VALID: {content: several wrapper export lines} => returns every re-exported name mapped to its wrapper path', () => {
    const content = FileContentsStub({
      value: `
        export { readJsonFileIfExists } from './read-json-file-if-exists/read-json-file-if-exists';
        export { writeFile } from './write-file/write-file';
        export { glob } from './glob/glob';
      `,
    });

    const result = gatewayBarrelWrapperPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([
        [
          IdentifierStub({ value: 'readJsonFileIfExists' }),
          'read-json-file-if-exists/read-json-file-if-exists',
        ],
        [
          IdentifierStub({ value: 'writeFile' }),
          'write-file/write-file',
        ],
        [IdentifierStub({ value: 'glob' }), 'glob/glob'],
      ]),
    );
  });

  it('EDGE: {content: a pass-through export * line} => excludes it, having no local wrapper folder', () => {
    const content = FileContentsStub({
      value: `
        export * from 'fs/promises';
        export { readFile } from './read-file/read-file';
      `,
    });

    const result = gatewayBarrelWrapperPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([
        [IdentifierStub({ value: 'readFile' }), 'read-file/read-file'],
      ]),
    );
  });

  it('EDGE: {content: a named re-export from the raw npm module, not a relative path} => excludes it', () => {
    const content = FileContentsStub({
      value: `
        export { XMLBuilder } from 'fast-xml-parser';
        export { glob } from './glob/glob';
      `,
    });

    const result = gatewayBarrelWrapperPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([[IdentifierStub({ value: 'glob' }), 'glob/glob']]),
    );
  });

  it('EDGE: {content: a type-only re-export beside a value one} => excludes only the type', () => {
    const content = FileContentsStub({
      value: `
        export { readdirEntries } from './readdir-entries/readdir-entries';
        export type { DirEntry } from './readdir-entries/dir-entry';
      `,
    });

    const result = gatewayBarrelWrapperPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([
        [
          IdentifierStub({ value: 'readdirEntries' }),
          'readdir-entries/readdir-entries',
        ],
      ]),
    );
  });

  it("EDGE: {content: a ../ climb into a different subpath's own folder} => excludes it, since that subpath owns the proxy", () => {
    // Reproduces fs__promises.ts re-exporting isFsError from the fs subpath's own folder: the
    // wrapper's proxy is fs.proxy.ts's concern, not fs__promises.proxy.ts's, so a caller importing
    // isFsError through fs__promises is never held to creating isFsErrorProxy.
    const content = FileContentsStub({
      value: `
        export { isFsError } from '../fs/is-fs-error/is-fs-error';
        export { readFile } from './read-file/read-file';
      `,
    });

    const result = gatewayBarrelWrapperPathsTransformer({ content });

    expect(result).toStrictEqual(
      new Map([
        [IdentifierStub({ value: 'readFile' }), 'read-file/read-file'],
      ]),
    );
  });

  it('EMPTY: {content: no export statements} => returns an empty map', () => {
    const content = FileContentsStub({
      value: `
        // Empty barrel.
      `,
    });

    const result = gatewayBarrelWrapperPathsTransformer({ content });

    expect(result).toStrictEqual(new Map());
  });
});
