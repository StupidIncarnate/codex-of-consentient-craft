import { questStatics } from './quest-statics';

describe('questStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(questStatics).toStrictEqual({
      json: {
        indentSpaces: 2,
      },
    });
  });
});
