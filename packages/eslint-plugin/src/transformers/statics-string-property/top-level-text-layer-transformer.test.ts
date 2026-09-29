import { ContentTextStub } from '@dungeonmaster/shared/contracts';
import { topLevelTextLayerTransformer } from './top-level-text-layer-transformer';

describe('topLevelTextLayerTransformer', () => {
  it('VALID: {nested object, array and call} => keeps only the object own top-level text', () => {
    const body = ContentTextStub({
      value: "cmd: 'git', nested: { cmd: 'npm' }, list: ['a'], fn: call(1) };\nafter",
    });

    expect(topLevelTextLayerTransformer({ body })).toBe("cmd: 'git', nested: , list: , fn: call ");
  });

  it('VALID: {line and block comments holding braces} => drops the comments', () => {
    const body = ContentTextStub({ value: "// a {\ncmd: 'x', /* } */ other: 'y' }" });

    expect(topLevelTextLayerTransformer({ body })).toBe("cmd: 'x',  other: 'y' ");
  });

  it('VALID: {an unbalanced brace inside a string} => does not move the depth', () => {
    const body = ContentTextStub({ value: "glob: 'a{b', cmd: 'npm' }" });

    expect(topLevelTextLayerTransformer({ body })).toBe("glob: 'a{b', cmd: 'npm' ");
  });

  it('VALID: {an escaped quote inside a string} => stays inside the string', () => {
    const body = ContentTextStub({ value: "a: 'it\\'s', b: 'c' }" });

    expect(topLevelTextLayerTransformer({ body })).toBe("a: 'it\\'s', b: 'c' ");
  });

  it('EDGE: {a line comment with no newline} => stops at the end of the text', () => {
    const body = ContentTextStub({ value: 'a: 1 // tail' });

    expect(topLevelTextLayerTransformer({ body })).toBe('a: 1 ');
  });

  it('EDGE: {an unterminated block comment} => stops at the end of the text', () => {
    const body = ContentTextStub({ value: 'a: 1 /* tail' });

    expect(topLevelTextLayerTransformer({ body })).toBe('a: 1 ');
  });
});
