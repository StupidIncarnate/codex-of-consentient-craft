import { globResolveTransformer } from './glob-resolve-transformer';
import { DiscoverInputStub } from '../../contracts/discover-input/discover-input.stub';
import { GlobPatternStub } from '../../contracts/glob-pattern/glob-pattern.stub';

describe('globResolveTransformer', () => {
  it('VALID: no glob => defaults to **/*', () => {
    const result = globResolveTransformer({});

    expect(result).toStrictEqual(GlobPatternStub({ value: '**/*' }));
  });

  it('VALID: glob with file extension => used as-is', () => {
    const { glob } = DiscoverInputStub({ glob: '**/*.sql' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(GlobPatternStub({ value: '**/*.sql' }));
  });

  it('VALID: glob with specific filename => used as-is', () => {
    const { glob } = DiscoverInputStub({ glob: '**/package.json' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(GlobPatternStub({ value: '**/package.json' }));
  });

  it('VALID: directory-like glob => appends /**/*', () => {
    const { glob } = DiscoverInputStub({ glob: 'packages/mcp/src' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(GlobPatternStub({ value: 'packages/mcp/src/**/*' }));
  });

  it('VALID: glob with wildcard but no extension => used as-is', () => {
    const { glob } = DiscoverInputStub({ glob: 'packages/hooks/src/guards/**' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(GlobPatternStub({ value: 'packages/hooks/src/guards/**' }));
  });

  it('VALID: glob with **/* suffix => used as-is', () => {
    const { glob } = DiscoverInputStub({ glob: 'packages/shared/src/contracts/quest-id/**/*' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(
      GlobPatternStub({ value: 'packages/shared/src/contracts/quest-id/**/*' }),
    );
  });

  it('VALID: glob with brace expansion => used as-is', () => {
    const { glob } = DiscoverInputStub({ glob: 'packages/mcp/src/**/*.{ts,json}' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(GlobPatternStub({ value: 'packages/mcp/src/**/*.{ts,json}' }));
  });

  it('VALID: glob with ts extension => used as-is', () => {
    const { glob } = DiscoverInputStub({ glob: '**/*.ts' });

    const result = globResolveTransformer({ glob: glob! });

    expect(result).toStrictEqual(GlobPatternStub({ value: '**/*.ts' }));
  });

  it('EDGE: empty string glob => defaults to **/*', () => {
    const result = globResolveTransformer({ glob: '' as never });

    expect(result).toStrictEqual(GlobPatternStub({ value: '**/*' }));
  });
});
