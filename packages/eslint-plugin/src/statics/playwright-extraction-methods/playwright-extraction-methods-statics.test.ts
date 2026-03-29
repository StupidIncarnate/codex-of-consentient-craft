import { playwrightExtractionMethodsStatics } from './playwright-extraction-methods-statics';

describe('playwrightExtractionMethodsStatics', () => {
  it('VALID: {} => has expected extraction methods and replacements', () => {
    expect(playwrightExtractionMethodsStatics).toStrictEqual({
      methods: {
        textContent: 'toHaveText',
        inputValue: 'toHaveValue',
        count: 'toHaveCount',
      },
    });
  });
});
