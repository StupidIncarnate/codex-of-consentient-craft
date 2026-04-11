import { contentGrepStatics } from './content-grep-statics';

describe('contentGrepStatics', () => {
  it('VALID: exported statics => matches exact expected shape', () => {
    expect(contentGrepStatics).toStrictEqual({
      regexPrefix: 're:',
      inlineFlagsPattern: '^\\(\\?([gimsuy]+)\\)',
      metacharPattern: '[.*+?^${}()|[\\]\\\\]',
      requiredFlags: 'gmu',
    });
  });

  it('VALID: metacharPattern compiles to a working escape regex', () => {
    const re = new RegExp(contentGrepStatics.metacharPattern, 'gu');
    const escaped = 'fs-mkdir-adapter.ts'.replace(re, '\\$&');

    expect(escaped).toBe('fs-mkdir-adapter\\.ts');
  });

  it('VALID: inlineFlagsPattern extracts flag letters', () => {
    const re = new RegExp(contentGrepStatics.inlineFlagsPattern, 'u');
    const m = re.exec('(?i)foo');

    expect(m?.[1]).toBe('i');
  });
});
