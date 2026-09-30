import { IdentifierStub } from '@dungeonmaster/shared/contracts/identifier/identifier.stub';
import { namedImportEntriesTransformer } from './named-import-entries-transformer';

describe('namedImportEntriesTransformer', () => {
  it('VALID: {namedImports: several names, importPath} => pairs every name with the same path', () => {
    const result = namedImportEntriesTransformer({
      namedImports: 'httpAdapter, dbAdapter',
      importPath: '../../adapters/shared-adapter',
    });

    expect(result).toStrictEqual([
      [
        IdentifierStub({ value: 'httpAdapter' }),
        '../../adapters/shared-adapter',
      ],
      [
        IdentifierStub({ value: 'dbAdapter' }),
        '../../adapters/shared-adapter',
      ],
    ]);
  });

  it("EDGE: {namedImports: a mixed value and per-name 'type' specifier} => excludes only the type", () => {
    const result = namedImportEntriesTransformer({
      namedImports: 'walkBroker, type WalkMemo',
      importPath: '../../brokers/walk/walk-broker',
    });

    expect(result).toStrictEqual([
      [
        IdentifierStub({ value: 'walkBroker' }),
        '../../brokers/walk/walk-broker',
      ],
    ]);
  });

  it('EMPTY: {namedImports: undefined} => returns an empty array', () => {
    const result = namedImportEntriesTransformer({
      namedImports: undefined,
      importPath: '../../adapters/http/http-adapter',
    });

    expect(result).toStrictEqual([]);
  });
});
