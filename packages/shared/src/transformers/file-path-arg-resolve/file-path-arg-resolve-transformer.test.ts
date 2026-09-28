import { filePathArgResolveTransformer } from './file-path-arg-resolve-transformer';
import { ContentTextStub } from '../../contracts/content-text/content-text.stub';

describe('filePathArgResolveTransformer', () => {
  it('VALID: {variable built from locationsStatics} => returns the statics reference', () => {
    const result = filePathArgResolveTransformer({
      source: ContentTextStub({
        value: [
          'const outboxPath = filePathContract.parse(',
          '  join(homePath, locationsStatics.dungeonmasterHome.eventOutbox),',
          ');',
        ].join('\n'),
      }),
      variableName: ContentTextStub({ value: 'outboxPath' }),
    });

    expect(result).toBe('<computed: locationsStatics.dungeonmasterHome.eventOutbox>');
  });

  it('VALID: {two variables, one statics-backed} => resolves only the named one', () => {
    const result = filePathArgResolveTransformer({
      source: ContentTextStub({
        value: [
          'const a = join(root, locationsStatics.repoRoot.questsDir);',
          'const b = join(root, "plain");',
        ].join('\n'),
      }),
      variableName: ContentTextStub({ value: 'b' }),
    });

    expect(result).toBe('<computed: b>');
  });

  it('VALID: {variable with no statics reference} => keeps its own name', () => {
    const result = filePathArgResolveTransformer({
      source: ContentTextStub({ value: "const tmpPath = join(dir, 'x.tmp');" }),
      variableName: ContentTextStub({ value: 'tmpPath' }),
    });

    expect(result).toBe('<computed: tmpPath>');
  });

  it('EMPTY: {variable declared nowhere in the source} => keeps its own name', () => {
    const result = filePathArgResolveTransformer({
      source: ContentTextStub({ value: 'export const f = ({ p }) => tailFile({ path: p });' }),
      variableName: ContentTextStub({ value: 'p' }),
    });

    expect(result).toBe('<computed: p>');
  });
});
