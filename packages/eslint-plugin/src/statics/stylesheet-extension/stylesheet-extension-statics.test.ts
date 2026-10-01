import { stylesheetExtensionStatics } from './stylesheet-extension-statics';

describe('stylesheetExtensionStatics', () => {
  it('VALID: exported value => matches expected shape', () => {
    expect(stylesheetExtensionStatics).toStrictEqual({
      extensions: ['.css', '.scss', '.sass', '.less', '.styl', '.pcss'],
    });
  });
});
