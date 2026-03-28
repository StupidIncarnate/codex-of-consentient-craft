import { markdownParserStatics } from './markdown-parser-statics';

describe('markdownParserStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(markdownParserStatics).toStrictEqual({
      headerPrefix: {
        level2: '## ',
        length: 3,
      },
    });
  });
});
