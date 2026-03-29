import { regexMatchMethodsStatics } from './regex-match-methods-statics';

describe('regexMatchMethodsStatics', () => {
  it('VALID: {} => has expected anchor-required methods', () => {
    expect(regexMatchMethodsStatics).toStrictEqual({
      anchorRequired: ['toMatch', 'toHaveText', 'toContainText'],
    });
  });
});
