import { contentTruncationConfigStatics } from './content-truncation-config-statics';

describe('contentTruncationConfigStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(contentTruncationConfigStatics).toStrictEqual({
      charLimit: 200,
      lineLimit: 8,
      longFieldLimit: 120,
      blockFieldLineLimit: 12,
      blockFieldCharLimit: 1200,
      msDivisor: 1000,
    });
  });
});
