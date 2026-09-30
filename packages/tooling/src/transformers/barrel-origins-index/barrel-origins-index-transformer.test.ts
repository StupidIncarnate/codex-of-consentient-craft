import { barrelOriginsIndexTransformer } from './barrel-origins-index-transformer';
import { CensusPackageStub } from '../../contracts/census-package/census-package.stub';
import { SourceFactsStub } from '../../contracts/source-facts/source-facts.stub';
import { ExportNameStub } from '../../contracts/export-name/export-name.stub';

describe('barrelOriginsIndexTransformer', () => {
  const packages = [CensusPackageStub({ name: '@acme/api', dir: 'packages/api' })];
  const barrel = 'packages/api/adapters.ts';
  const readAdapter = 'packages/api/src/adapters/a/a-adapter.ts';
  const writeAdapter = 'packages/api/src/adapters/b/b-adapter.ts';

  it('VALID: {a barrel of export * lines} => each name maps to the file that defines it', () => {
    const factsByFile = new Map([
      [
        barrel,
        SourceFactsStub({
          reExports: [
            {
              specifier: './src/adapters/a/a-adapter',
              names: [],
              isStar: true,
            },
            {
              specifier: './src/adapters/b/b-adapter',
              names: [],
              isStar: true,
            },
          ],
        }),
      ],
      [readAdapter, SourceFactsStub({ exportNames: [ExportNameStub({ value: 'aAdapter' })] })],
      [writeAdapter, SourceFactsStub({ exportNames: [ExportNameStub({ value: 'bAdapter' })] })],
    ]);

    const result = barrelOriginsIndexTransformer({
      file: barrel,
      factsByFile,
      knownFiles: new Set([barrel, readAdapter, writeAdapter]),
      packages,
    });

    expect([...result.entries()]).toStrictEqual([
      ['aAdapter', 'packages/api/src/adapters/a/a-adapter.ts'],
      ['bAdapter', 'packages/api/src/adapters/b/b-adapter.ts'],
    ]);
  });

  it('VALID: {a named re-export} => only that name maps to the target', () => {
    const factsByFile = new Map([
      [
        barrel,
        SourceFactsStub({
          reExports: [
            {
              specifier: './src/adapters/a/a-adapter',
              names: [ExportNameStub({ value: 'aAdapter' })],
              isStar: false,
            },
          ],
        }),
      ],
      [
        readAdapter,
        SourceFactsStub({
          exportNames: [ExportNameStub({ value: 'aAdapter' }), ExportNameStub({ value: 'other' })],
        }),
      ],
    ]);

    const result = barrelOriginsIndexTransformer({
      file: barrel,
      factsByFile,
      knownFiles: new Set([barrel, readAdapter]),
      packages,
    });

    expect([...result.entries()]).toStrictEqual([
      ['aAdapter', 'packages/api/src/adapters/a/a-adapter.ts'],
    ]);
  });

  it('VALID: {a barrel that re-exports another barrel} => names map through to the origin', () => {
    const inner = 'packages/api/src/adapters/index.ts';
    const factsByFile = new Map([
      [
        barrel,
        SourceFactsStub({
          reExports: [
            {
              specifier: './src/adapters/index',
              names: [],
              isStar: true,
            },
          ],
        }),
      ],
      [
        inner,
        SourceFactsStub({
          reExports: [
            {
              specifier: './a/a-adapter',
              names: [],
              isStar: true,
            },
          ],
        }),
      ],
      [readAdapter, SourceFactsStub({ exportNames: [ExportNameStub({ value: 'aAdapter' })] })],
    ]);

    const result = barrelOriginsIndexTransformer({
      file: barrel,
      factsByFile,
      knownFiles: new Set([barrel, inner, readAdapter]),
      packages,
    });

    expect(result.get(ExportNameStub({ value: 'aAdapter' }))).toBe(
      'packages/api/src/adapters/a/a-adapter.ts',
    );
  });

  it('EMPTY: {a file with no facts} => an empty index', () => {
    const result = barrelOriginsIndexTransformer({
      file: barrel,
      factsByFile: new Map(),
      knownFiles: new Set(),
      packages,
    });

    expect([...result.entries()]).toStrictEqual([]);
  });

  it('EMPTY: {a re-export naming no known file} => skipped', () => {
    const factsByFile = new Map([
      [
        barrel,
        SourceFactsStub({
          reExports: [
            {
              specifier: 'zod',
              names: [ExportNameStub({ value: 'z' })],
              isStar: false,
            },
          ],
        }),
      ],
    ]);

    const result = barrelOriginsIndexTransformer({
      file: barrel,
      factsByFile,
      knownFiles: new Set([barrel]),
      packages,
    });

    expect([...result.entries()]).toStrictEqual([]);
  });

  it('EDGE: {a barrel that defines a name itself} => the name maps to the barrel', () => {
    const factsByFile = new Map([
      [barrel, SourceFactsStub({ exportNames: [ExportNameStub({ value: 'local' })] })],
    ]);

    const result = barrelOriginsIndexTransformer({
      file: barrel,
      factsByFile,
      knownFiles: new Set([barrel]),
      packages,
    });

    expect([...result.entries()]).toStrictEqual([['local', 'packages/api/adapters.ts']]);
  });
});
