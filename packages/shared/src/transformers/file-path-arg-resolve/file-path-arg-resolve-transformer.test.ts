import { filePathArgResolveTransformer } from './file-path-arg-resolve-transformer';

describe('filePathArgResolveTransformer', () => {
  it('VALID: {variable built from locationsStatics} => returns the statics reference', () => {
    const result = filePathArgResolveTransformer({
      source: [
          'const outboxPath = filePathContract.parse(',
          '  join(homePath, locationsStatics.dungeonmasterHome.eventOutbox),',
          ');',
        ].join('\n'),
      variableName: 'outboxPath',
    });

    expect(result).toBe('<computed: locationsStatics.dungeonmasterHome.eventOutbox>');
  });

  it('VALID: {two variables, one statics-backed} => resolves only the named one', () => {
    const result = filePathArgResolveTransformer({
      source: [
          'const a = join(root, locationsStatics.repoRoot.questsDir);',
          'const b = join(root, "plain");',
        ].join('\n'),
      variableName: 'b',
    });

    expect(result).toBe('<computed: b>');
  });

  it('VALID: {variable with no statics reference} => keeps its own name', () => {
    const result = filePathArgResolveTransformer({
      source: "const tmpPath = join(dir, 'x.tmp');",
      variableName: 'tmpPath',
    });

    expect(result).toBe('<computed: tmpPath>');
  });

  it('EMPTY: {variable declared nowhere in the source} => keeps its own name', () => {
    const result = filePathArgResolveTransformer({
      source: 'export const f = ({ p }) => tailFile({ path: p });',
      variableName: 'p',
    });

    expect(result).toBe('<computed: p>');
  });
});
