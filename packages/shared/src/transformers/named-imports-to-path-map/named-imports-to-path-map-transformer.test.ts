import { ContentTextStub } from '../../contracts/content-text/content-text.stub';
import { namedImportsToPathMapTransformer } from './named-imports-to-path-map-transformer';

describe('namedImportsToPathMapTransformer', () => {
  it('VALID: {single named import} => maps name to from-path', () => {
    const source = ContentTextStub({
      value:
        "import { QuestStartResponder } from '../../responders/quest/start/quest-start-responder';",
    });

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get(ContentTextStub({ value: 'QuestStartResponder' }))).toBe(
      ContentTextStub({ value: '../../responders/quest/start/quest-start-responder' }),
    );
  });

  it('VALID: {multiple named imports in one statement} => maps each to same path', () => {
    const source = ContentTextStub({
      value: "import { Foo, Bar } from './baz';",
    });

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get(ContentTextStub({ value: 'Foo' }))).toBe(ContentTextStub({ value: './baz' }));
    expect(result.get(ContentTextStub({ value: 'Bar' }))).toBe(ContentTextStub({ value: './baz' }));
  });

  it('VALID: {aliased import "as"} => maps the local alias to the path', () => {
    const source = ContentTextStub({
      value: "import { Original as Aliased } from './source';",
    });

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get(ContentTextStub({ value: 'Aliased' }))).toBe(
      ContentTextStub({ value: './source' }),
    );
    expect(result.get(ContentTextStub({ value: 'Original' }))).toBe(undefined);
  });

  it('VALID: {type-only import} => still maps the named symbol', () => {
    const source = ContentTextStub({
      value: "import type { MyType } from './type-source';",
    });

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.get(ContentTextStub({ value: 'MyType' }))).toBe(
      ContentTextStub({ value: './type-source' }),
    );
  });

  it('VALID: {default + namespace imports} => skipped (only named imports tracked)', () => {
    const source = ContentTextStub({
      value: "import Default from './default';\nimport * as NS from './ns';",
    });

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.size).toBe(0);
  });

  it('EMPTY: {source with no imports} => returns empty map', () => {
    const source = ContentTextStub({ value: 'const x = 1;' });

    const result = namedImportsToPathMapTransformer({ source });

    expect(result.size).toBe(0);
  });
});
