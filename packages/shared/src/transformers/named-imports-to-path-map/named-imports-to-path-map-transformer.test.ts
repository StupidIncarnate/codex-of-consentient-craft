import { namedImportsToPathMapTransformer } from './named-imports-to-path-map-transformer';

describe('namedImportsToPathMapTransformer', () => {
  it('VALID: {single named import} => maps name to from-path', () => {
    const source = "import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';";

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get('QuestStartResponder')).toBe(
      '../../responders/quest/start/quest-start-responder',
    );
  });

  it('VALID: {multiple named imports in one statement} => maps each to same path', () => {
    const source = "import { Foo, Bar } from './baz';";

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get('Foo')).toBe('./baz');
    expect(result.get('Bar')).toBe('./baz');
  });

  it('VALID: {aliased import "as"} => maps the local alias to the path', () => {
    const source = "import { Original as Aliased } from './source';";

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get('Aliased')).toBe(
      './source',
    );
    expect(result.get('Original')).toBe(undefined);
  });

  it('VALID: {type-only import} => still maps the named symbol', () => {
    const source = "import type { MyType } from './type-source';";

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get('MyType')).toBe(
      './type-source',
    );
  });

  it('VALID: {default + namespace imports} => skipped (only named imports tracked)', () => {
    const source = "import Default from './default';\nimport * as NS from './ns';";

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.size).toBe(0);
  });

  it('EMPTY: {source with no imports} => returns empty map', () => {
    const source = 'const x = 1;';

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.size).toBe(0);
  });
});
