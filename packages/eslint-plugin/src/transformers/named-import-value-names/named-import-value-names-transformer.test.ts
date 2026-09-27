import { IdentifierStub } from '@dungeonmaster/shared/contracts';
import { namedImportValueNamesTransformer } from './named-import-value-names-transformer';

describe('namedImportValueNamesTransformer', () => {
  it('VALID: {namedImports: a single plain name} => returns that one name', () => {
    const result = namedImportValueNamesTransformer({ namedImports: 'walkBroker' });

    expect(result).toStrictEqual([IdentifierStub({ value: 'walkBroker' })]);
  });

  it('VALID: {namedImports: several plain names} => returns every name', () => {
    const result = namedImportValueNamesTransformer({ namedImports: 'httpAdapter, dbAdapter' });

    expect(result).toStrictEqual([
      IdentifierStub({ value: 'httpAdapter' }),
      IdentifierStub({ value: 'dbAdapter' }),
    ]);
  });

  it('VALID: {namedImports: a name with an "as" alias} => returns the SOURCE name, not the local alias', () => {
    const result = namedImportValueNamesTransformer({ namedImports: 'httpAdapter as httpClient' });

    expect(result).toStrictEqual([IdentifierStub({ value: 'httpAdapter' })]);
  });

  it("EDGE: {namedImports: a mixed value and per-name 'type' specifier} => excludes only the type", () => {
    const result = namedImportValueNamesTransformer({
      namedImports: 'walkBroker, type WalkMemo',
    });

    expect(result).toStrictEqual([IdentifierStub({ value: 'walkBroker' })]);
  });

  it('EMPTY: {namedImports: only a type specifier} => returns an empty array', () => {
    const result = namedImportValueNamesTransformer({ namedImports: 'type WalkMemo' });

    expect(result).toStrictEqual([]);
  });
});
